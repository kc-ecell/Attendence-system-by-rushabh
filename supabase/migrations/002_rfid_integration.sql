-- ==============================================================================
-- 002_rfid_integration.sql
-- Attendance System & RFID Door Access Subsystem Migration
-- ==============================================================================

-- 1. Enable required extensions
create extension if not exists "pgcrypto";

-- 2. Doors table
create table if not exists public.doors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  enabled boolean not null default true,
  unlock_window_ms integer not null default 5000,
  held_open_alarm_ms integer not null default 30000,
  override_mode boolean not null default false,
  override_unlock_window_ms integer not null default 60000 check (override_unlock_window_ms between 5000 and 120000),
  override_expires_at timestamptz
);

-- Seed default door if not present
insert into public.doors (id, name, code, enabled, unlock_window_ms, held_open_alarm_ms)
values ('11111111-1111-1111-1111-111111111111', 'Main Entry Door', 'main-door', true, 5000, 30000)
on conflict (code) do nothing;

-- 3. Hardware Devices table (ESP32 / NodeMCU identities)
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  door_id uuid not null references public.doors(id) on delete cascade,
  name text not null,
  secret_sha256 text not null,
  enabled boolean not null default true,
  last_seen_at timestamptz,
  firmware_version text
);

create index if not exists idx_devices_door_id on public.devices(door_id);

-- 4. People table (Badge holders, linked optionally to Attendance members)
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  full_name text not null,
  class_name text not null default '',
  division text not null default '',
  academic_year text not null default '',
  role text not null default 'member' check (role in ('member', 'admin')),
  access_enabled boolean not null default true,
  notes text not null default '',
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_people_member_id on public.people(member_id);
create index if not exists idx_people_access_enabled on public.people(access_enabled);

-- 5. Cards table (Physical RFID UIDs mapped to badge holders)
create table if not exists public.cards (
  uid text primary key,
  person_id uuid not null references public.people(id) on delete cascade,
  active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_cards_person_id on public.cards(person_id);

-- 6. Access Revision Counter (Singleton for ESP32 allow-list cache invalidation)
create table if not exists public.access_revision (
  singleton boolean primary key default true,
  value bigint not null default 1,
  constraint access_revision_singleton_check check (singleton = true)
);

insert into public.access_revision (singleton, value)
values (true, 1)
on conflict (singleton) do nothing;

-- Function to increment revision whenever cards or people change
create or replace function public.bump_access_revision()
returns trigger as $$
begin
  update public.access_revision set value = value + 1 where singleton = true;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_bump_cards on public.cards;
create trigger trigger_bump_cards
after insert or update or delete on public.cards
for each statement execute function public.bump_access_revision();

drop trigger if exists trigger_bump_people on public.people;
create trigger trigger_bump_people
after update of access_enabled, role on public.people
for each statement execute function public.bump_access_revision();

-- 7. Enrollment Requests table (Physical badge pairing workflow)
create table if not exists public.enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  door_id uuid not null references public.doors(id) on delete cascade,
  requested_by text,
  status text not null default 'requested' check (status in ('requested', 'awaiting_card', 'completed', 'cancelled', 'expired')),
  admin_person_id uuid references public.people(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '2 minutes'),
  created_at timestamptz not null default now(),
  error_message text
);

create index if not exists idx_enrollment_requests_door_id on public.enrollment_requests(door_id);

-- 8. Remote Unlock Requests table (Web dashboard "Open Door" trigger)
create table if not exists public.remote_unlock_requests (
  id uuid primary key default gen_random_uuid(),
  door_id uuid not null references public.doors(id) on delete cascade,
  requested_by text,
  status text not null default 'requested' check (status in ('requested', 'completed', 'expired')),
  expires_at timestamptz not null default (now() + interval '20 seconds'),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_remote_unlock_requests_door_status on public.remote_unlock_requests(door_id, status);

-- 9. Access Events table (Door Activity Logs)
create table if not exists public.access_events (
  id bigint primary key generated always as identity,
  event_uuid uuid unique,
  door_id uuid not null references public.doors(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  uid text,
  decision text not null,
  reason text not null,
  offline boolean not null default false,
  device_time text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_access_events_created_at on public.access_events(created_at desc);
create index if not exists idx_access_events_person_id on public.access_events(person_id);

-- 10. Atomic Enrollment Completion Procedure
create or replace function public.device_complete_enrollment(
  p_device_id uuid,
  p_request_id uuid,
  p_uid text
)
returns jsonb as $$
declare
  v_door_id uuid;
  v_req record;
  v_uid text;
begin
  v_uid := upper(trim(p_uid));

  -- Verify device
  select door_id into v_door_id
  from public.devices
  where id = p_device_id and enabled = true;

  if not found then
    raise exception 'DEVICE_DISABLED_OR_NOT_FOUND';
  end if;

  -- Verify enrollment request
  select * into v_req
  from public.enrollment_requests
  where id = p_request_id
    and door_id = v_door_id
    and status in ('requested', 'awaiting_card')
    and expires_at > now();

  if not found then
    raise exception 'ENROLLMENT_EXPIRED_OR_NOT_FOUND';
  end if;

  -- Upsert card
  insert into public.cards (uid, person_id, active, created_by)
  values (v_uid, v_req.person_id, true, 'device_enrollment')
  on conflict (uid) do update
  set person_id = v_req.person_id,
      active = true;

  -- Mark enrollment complete
  update public.enrollment_requests
  set status = 'completed'
  where id = p_request_id;

  -- Invalidate allow-list cache
  update public.access_revision
  set value = value + 1
  where singleton = true;

  return jsonb_build_object(
    'person_id', v_req.person_id,
    'uid', v_uid
  );
end;
$$ language plpgsql security definer;

-- 11. Add pending_rfid_exit_at to sessions for 15-minute buffer
alter table if exists public.sessions
  add column if not exists pending_rfid_exit_at timestamptz;

-- 12. Enable Supabase Realtime publication
alter publication supabase_realtime add table public.access_events;
alter publication supabase_realtime add table public.enrollment_requests;
alter publication supabase_realtime add table public.doors;
alter publication supabase_realtime add table public.people;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.remote_unlock_requests;
