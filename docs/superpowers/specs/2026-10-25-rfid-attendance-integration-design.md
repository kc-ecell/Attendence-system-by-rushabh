# RFID & Door Access Integration Specification

**Date:** 2026-10-25  
**Project:** Attendance System & RFID Hardware Integration  
**Status:** Approved for Implementation  

---

## 1. Goal & Requirements

### Context
The college E-Cell currently has two standalone systems:
1. **Attendance System**: A deployed Next.js 16 (App Router) web application hosted at a custom domain, using Supabase for storage/auth, custom JWT authentication (`ecell_session`), and a "Cosmic × Vanilla" dark design system (`#1c1a24` background, `#f1fec8` lime-vanilla accent, Gilroy typography, and Framer Motion spring transitions).
2. **RFID Door Access System**: An IoT access control system running locally, featuring physical ESP32 and NodeMCU controllers (MFRC522 RFID reader, relay for 12V electric strike, IR touchless sensor, exit reader), a Supabase Edge Function (`device-api`), and a vanilla TypeScript/Vite admin dashboard.

### Objective
Integrate the complete RFID door control and card management system directly into the deployed Attendance System's Admin Dashboard (`/admin`). All door operations, live card scan logs, remote door unlock, any-card override mode, and card enrollment will live inside the single attendance web application under the same domain, styled natively with the Attendance System's UI/UX.

### Core Requirements
1. **Unified Admin Webpage**: All RFID admin features must live in a dedicated **"RFID & Door"** tab within `/admin`.
2. **Feature Parity**: Every feature from the RFID admin dashboard must be ported with zero loss of functionality:
   - Summary stat counters (Total registered people, Access enabled, Cards assigned).
   - "Open door" remote unlock button with countdown and cooldown feedback.
   - "Any-card mode" (2-hour event override) toggle with auto-revert.
   - Real-time live card scan activity log (timestamp, person name, decision badge, reason, offline badge, device name).
   - Real-time updates via Supabase Realtime (scans display live without page refreshes).
   - People & Cards management (Add person, Edit person, Grant/Revoke access, Delete person, manual UID assignment).
   - Card enrollment workflow (live enrollment banner, supervisor badge verification step, new card tap binding, cancel button).
3. **Attendance Linkage & 15-Minute Exit Buffer**:
   - People in the RFID system have an optional link to an Attendance `member`.
   - **Entry tap (`ACCESS_GRANTED`):** Automatically creates or resumes today's attendance session for the linked member (skipping manual OTP entry).
   - **Exit tap (`exit`):** Records an exit event and triggers a 15-minute checkout buffer. If the member submits their work description online within 15 minutes, their custom text is saved. If the buffer expires, the session automatically seals with `"Checked out via door RFID exit"`.
4. **Strict Admin Gating**:
   - RFID tabs, APIs, and logs are strictly hidden from students/members.
   - All backend API endpoints verify admin status via `requireAdmin()` (validating the signed `ecell_session` JWT cookie).
5. **No Immediate Data Migration**: Schema and tables will be created fresh in the Attendance Supabase project. Existing historical data can be loaded whenever desired.
6. **Hardware Compatibility**: The Supabase Edge Function `device-api` will be hosted on the Attendance Supabase project, matching the existing request/response protocol so hardware firmware requires only updating the Supabase project URL and anon key.

---

## 2. Architecture & Data Flow

```
+-------------------------------------------------------------+
|                     Physical Hardware                       |
|  - Main ESP32 Door Reader (MFRC522 SPI, Relay, IR Exit)    |
|  - NodeMCU Inside Exit Reader                               |
|  - NodeMCU Remote Unlock Receiver                           |
+------------------------------+------------------------------+
                               | HTTPS POST (device auth)
                               v
+-------------------------------------------------------------+
|        Supabase Edge Function: device-api                   |
|        (Hosted on Attendance Supabase Project)              |
|  - authorize (entry/exit + auto attendance check-in)        |
|  - sync (offline allow-list cache)                          |
|  - log_batch (offline queued event upload)                  |
|  - enrollment_status / verify_admin / complete_enrollment   |
|  - remote_unlock_status                                     |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|             Attendance Supabase Database                    |
|  Existing Tables:                                           |
|    members, sessions, otps, projects, etc.                  |
|  New RFID Tables:                                           |
|    doors, devices, people, cards, access_events,            |
|    enrollment_requests, remote_unlock_requests,             |
|    access_revision                                          |
+------------------------------+------------------------------+
                               | Realtime & REST
                               v
+-------------------------------------------------------------+
|         Next.js Attendance Admin Web Application            |
|                     (/admin Route)                          |
|  - Gated by requireAdmin() JWT middleware                   |
|  - Tab: "RFID & Door Access" (Cosmic x Vanilla Design)      |
|  - Live scan feed, door controls, card enrollment           |
+-------------------------------------------------------------+
```

---

## 3. Database Schema

The following tables, indexes, triggers, and RLS policies are added to the Attendance Supabase project:

### Tables
1. **`doors`**:
   - `id` (UUID, PK, default `gen_random_uuid()`)
   - `name` (text, not null)
   - `code` (text, unique, not null)
   - `enabled` (boolean, default true)
   - `unlock_window_ms` (integer, default 5000)
   - `held_open_alarm_ms` (integer, default 30000)
   - `override_mode` (boolean, default false)
   - `override_unlock_window_ms` (integer, default 60000)
   - `override_expires_at` (timestamptz, nullable)

2. **`devices`**:
   - `id` (UUID, PK, default `gen_random_uuid()`)
   - `door_id` (UUID, FK -> `doors(id)`, on delete cascade)
   - `name` (text, not null)
   - `secret_sha256` (text, not null)
   - `enabled` (boolean, default true)
   - `last_seen_at` (timestamptz, nullable)
   - `firmware_version` (text, nullable)

3. **`people`**:
   - `id` (UUID, PK, default `gen_random_uuid()`)
   - `member_id` (UUID, FK -> `members(id)`, on delete set null, nullable)
   - `full_name` (text, not null)
   - `class_name` (text, default '')
   - `division` (text, default '')
   - `academic_year` (text, default '')
   - `role` (text, default 'member') -- 'member' | 'admin' (supervisor badge)
   - `access_enabled` (boolean, default true)
   - `notes` (text, default '')
   - `created_by` (text, nullable)
   - `created_at` (timestamptz, default `now()`)

4. **`cards`**:
   - `uid` (text, PK) -- uppercase hex (e.g. '04A1B2C3')
   - `person_id` (UUID, FK -> `people(id)`, on delete cascade)
   - `active` (boolean, default true)
   - `created_by` (text, nullable)
   - `created_at` (timestamptz, default `now()`)

5. **`access_events`**:
   - `id` (bigint, PK, generated always as identity)
   - `event_uuid` (UUID, unique, nullable)
   - `door_id` (UUID, FK -> `doors(id)`)
   - `device_id` (UUID, FK -> `devices(id)`)
   - `person_id` (UUID, FK -> `people(id)`, nullable)
   - `uid` (text, nullable)
   - `decision` (text, not null) -- 'granted' | 'denied' | 'exit' | 'door_opened' | 'door_closed' | 'door_held_open' | etc.
   - `reason` (text, not null)
   - `offline` (boolean, default false)
   - `device_time` (text, nullable)
   - `metadata` (jsonb, default '{}'::jsonb)
   - `created_at` (timestamptz, default `now()`)

6. **`enrollment_requests`**:
   - `id` (UUID, PK, default `gen_random_uuid()`)
   - `person_id` (UUID, FK -> `people(id)`, on delete cascade)
   - `door_id` (UUID, FK -> `doors(id)`, on delete cascade)
   - `requested_by` (text, nullable)
   - `status` (text, default 'requested') -- 'requested' | 'awaiting_card' | 'completed' | 'cancelled' | 'expired'
   - `admin_person_id` (UUID, FK -> `people(id)`, nullable)
   - `expires_at` (timestamptz, not null)
   - `created_at` (timestamptz, default `now()`)
   - `error_message` (text, nullable)

7. **`remote_unlock_requests`**:
   - `id` (UUID, PK, default `gen_random_uuid()`)
   - `door_id` (UUID, FK -> `doors(id)`, on delete cascade)
   - `requested_by` (text, nullable)
   - `status` (text, default 'requested') -- 'requested' | 'completed' | 'expired'
   - `expires_at` (timestamptz, not null)
   - `created_at` (timestamptz, default `now()`)
   - `completed_at` (timestamptz, nullable)

8. **`access_revision`**:
   - `singleton` (boolean, PK, default true)
   - `value` (bigint, default 1)

### Stored Procedures
- `device_complete_enrollment(p_device_id uuid, p_request_id uuid, p_uid text)`: Atomically binds a scanned UID to the enrollment request target person, updates `cards`, increments `access_revision`, and marks the enrollment `completed`.

### Realtime Publication
Tables `access_events`, `enrollment_requests`, `people`, `cards`, `doors`, `remote_unlock_requests` are added to the `supabase_realtime` publication.

---

## 4. Attendance Automation & 15-Minute Exit Buffer

### Entry Tap: Auto Check-In
When `device-api` authorizes an entry tap (`action: "authorize"`, `direction: "entry"`) and access is granted:
1. Lookup the `people` record. If `member_id` is set:
2. Check for an existing open session today in `sessions` where `member_id = person.member_id` and `logout_time IS NULL`.
3. If no session exists:
   - Calculate IST day boundary.
   - Insert new row into `sessions`:
     - `member_id`: `person.member_id`
     - `login_time`: `now()`
     - `target_minutes`: 240 (default 4 hours)
     - `work_description`: `null`
     - `logout_type`: `null`
4. Session is now active. When the student opens `https://logs.kcecell.org/dashboard`, they see their live active timer running immediately!

### Exit Tap: 15-Minute Buffer Engine
When an exit event occurs (`action: "authorize"`, `direction: "exit"`, or exit reader handshake):
1. Lookup the `people` record. If `member_id` is set:
2. Find the student's active session where `logout_time IS NULL`.
3. If found:
   - Set a temporary checkout marker in the session metadata or session row:
     - `pending_rfid_exit_at`: `now()`
   - Schedule/allow a 15-minute buffer.
   - If the student checks out via the web dashboard within 15 minutes, their custom work description is recorded normally (`logout_type = 'manual'`).
   - If the student does not check out within 15 minutes:
     - Auto-close the session with:
       - `logout_time`: `pending_rfid_exit_at`
       - `duration_minutes`: computed between `login_time` and `logout_time`
       - `logout_type`: `'rfid_auto'`
       - `work_description`: `'Checked out via door RFID exit'`

---

## 5. Next.js Admin APIs (`/api/admin/rfid/*`)

All routes require authentication via `requireAdmin(request)` (reading `ecell_session` cookie). Non-admins receive `401 / 403 Forbidden`.

1. **`GET /api/admin/rfid/overview`**:
   - Returns counts (people, active cards, doors, override state), list of doors, pending enrollment if any, and initial 30 access events.
2. **`GET /api/admin/rfid/people`**:
   - List all people with joined cards and joined member details (`name`, `email`, `pnr_number`).
3. **`POST /api/admin/rfid/people`**:
   - Create new person (name, class, division, year, role, notes, optional `member_id`, optional manual card `uid`).
4. **`PATCH /api/admin/rfid/people/[id]`**:
   - Update person fields, update/create card UID, toggle `access_enabled`.
5. **`DELETE /api/admin/rfid/people/[id]`**:
   - Delete person and associated cards (requires `access_enabled = false` first).
6. **`POST /api/admin/rfid/doors/[id]/unlock`**:
   - Creates a `remote_unlock_requests` row expiring in 20 seconds.
7. **`PATCH /api/admin/rfid/doors/[id]/override`**:
   - Toggles `override_mode` (any-card mode) with 2-hour expiration.
8. **`POST /api/admin/rfid/enroll`**:
   - Initiates card enrollment for a person at a door (status `requested`, 120s expiry).
9. **`DELETE /api/admin/rfid/enroll/[id]`**:
   - Cancels pending enrollment.

---

## 6. Frontend: Admin Dashboard "RFID & Door" Tab

### Placement & Styling
- In `src/app/admin/page.tsx`, add a new tab button:
  ```tsx
  <button onClick={() => setActiveTab('rfid')} ...>
    <Radio className="w-4 h-4" />
    RFID & Door
  </button>
  ```
- Uses the **"Cosmic × Vanilla"** design tokens:
  - Background panels: `.panel` and `.glass-card`
  - Typography: Gilroy heading, JetBrains Mono for monospace card UIDs and timestamps
  - Palette: `#1c1a24` background, `#23212c` surface-1, `#2b2937` surface-2, `#f1fec8` vanilla accent
  - Microinteractions: Framer Motion spring transitions

### Layout Sections
1. **Top Action & Status Bar**:
   - Door selector (if multiple doors, defaults to primary).
   - "Open door" button (`btn-primary` with lock icon; disables for 10s with spinner on click).
   - "Any-card mode" toggle badge & button (indicates active / inactive, with expiration timer).
2. **Summary Stats (3 cards)**:
   - Registered People
   - Access Enabled
   - Cards Assigned
3. **Live Card Enrollment Banner (Conditional)**:
   - Appears when `enrollment_requests` has an active request (`requested` or `awaiting_card`).
   - Shows person name, current step ("Scan admin supervisor card" vs "Scan new card"), expiry countdown, and "Cancel" button.
4. **Main Two-Column Grid**:
   - **Left Column**: "Add / Edit Person" card.
     - Inputs: Full Name, Class, Division, Academic Year, Door Role (Member / Physical Enrollment Admin).
     - Link to Member dropdown: allows choosing an existing Attendance member to associate with this door badge.
     - Card UID input (hexadecimal validation `8-20` chars).
     - Notes textarea.
     - "Save / Add Person" and "Cancel" buttons.
   - **Right Column (Stacked)**:
     - **People & Cards Table**:
       - Columns: Person (name, class/div/year), Member Link, Role, Card UID (monospace), Access Status (Granted / Revoked badge), Actions.
       - Row Actions: Edit, Grant/Revoke access, Enroll Card (triggers physical reader enrollment), Delete.
     - **Recent Door Activity Logs**:
       - Real-time live table displaying the latest 30 scans.
       - Subscribes to Supabase Realtime channel for instant card tap updates.
       - Columns: Time, Person, Event (green for `granted`/`exit`, red for `denied`), Reason, Device, Offline badge.

---

## 7. Security & Non-Admin Isolation

1. **Route Security**:
   - `/admin` page already checks `requireAdmin()`.
   - All `/api/admin/rfid/*` endpoints run `requireAdmin(request)` before processing any data.
   - Regular members visiting `/dashboard` have no links, tabs, or API access to RFID data.
2. **Hardware Authentication**:
   - Devices communicate only with the Edge Function `device-api`.
   - Each hardware request includes `x-device-id` and `x-device-secret`.
   - The secret is hashed with SHA-256 on the server and compared against the stored hash in constant time.
   - The Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` internally, ensuring RLS cannot be bypassed by unauthenticated requests.

---

## 8. Verification & Test Plan

1. **Database Migration Verification**:
   - Run SQL migration in Attendance Supabase project.
   - Confirm all 8 tables and functions are created.
   - Confirm Realtime replication is enabled for `access_events`, `enrollment_requests`, `doors`.
2. **API Endpoint Testing**:
   - Verify non-admin gets `401/403` on all `/api/admin/rfid/*` routes.
   - Verify admin can add, edit, toggle access, and delete a person.
   - Verify remote unlock inserts record with 20s expiry.
   - Verify override mode updates `doors` record with 2h expiry.
3. **Admin UI Testing**:
   - Navigate to `/admin` -> "RFID & Door" tab.
   - Confirm stats, people table, and logs table render properly with "Cosmic × Vanilla" dark styling.
   - Test "Add Person" and assign card UID.
   - Test "Open Door" button triggers unlock.
4. **Live Realtime Verification**:
   - Insert a mock row into `access_events`.
   - Confirm the new row immediately animates into the Recent Activity table in the admin browser tab without refreshing the page.
5. **Auto-Attendance & 15-Minute Buffer Testing**:
   - Simulate an authorized entry tap for a person linked to an Attendance member -> confirm session is created in `sessions`.
   - Simulate an exit tap -> confirm 15-minute checkout buffer is applied.
