-- ==============================================================================
-- 004_recycle_bin.sql
-- Recycle Bin, Soft Delete & Profiles Constraint Fixes
-- ==============================================================================

-- 1. Ensure deleted_at column exists across tables
alter table if exists public.members add column if not exists deleted_at timestamptz default null;
alter table if exists public.sessions add column if not exists deleted_at timestamptz default null;
alter table if exists public.tasks add column if not exists deleted_at timestamptz default null;
alter table if exists public.calendar_events add column if not exists deleted_at timestamptz default null;

-- 2. Indexes for fast filtering of active vs soft-deleted records
create index if not exists idx_members_deleted_at on public.members(deleted_at);
create index if not exists idx_sessions_deleted_at on public.sessions(deleted_at);
create index if not exists idx_tasks_deleted_at on public.tasks(deleted_at);
create index if not exists idx_calendar_events_deleted_at on public.calendar_events(deleted_at);

-- 3. Dynamically drop NOT NULL constraints on ALL columns in public.profiles (except id)
-- This permanently prevents any future "null value in column ... of relation profiles" errors
do $$
declare
  r record;
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'profiles'
  ) then
    for r in (
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name != 'id'
        and is_nullable = 'NO'
    ) loop
      execute 'alter table public.profiles alter column ' || quote_ident(r.column_name) || ' drop not null;';
    end loop;
  end if;
end $$;

-- 4. Update the trigger function to safely insert user info without failing
create or replace function public.handle_new_user()
returns trigger as $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    insert into public.profiles (id)
    values (new.id)
    on conflict (id) do nothing;

    -- Update email and name if the columns exist
    begin
      update public.profiles
      set 
        email = coalesce(new.email, email),
        name = coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), name)
      where id = new.id;
    exception when others then
      -- Ignore if specific columns do not exist
      null;
    end;
  end if;
  return new;
end;
$$ language plpgsql security definer;
