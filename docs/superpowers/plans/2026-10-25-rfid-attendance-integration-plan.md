# Implementation Plan: RFID & Door Access Integration

**Date:** 2026-10-25  
**Spec Reference:** [`docs/superpowers/specs/2026-10-25-rfid-attendance-integration-design.md`](file:///C:/Users/rusha/Projects/college-projects/Web/Attendance%20$%20RFID/Attendence-system-by-rushabh/docs/superpowers/specs/2026-10-25-rfid-attendance-integration-design.md)  
**Target Project:** `Attendence-system-by-rushabh`  

---

## Plan Objectives

Integrate the RFID door access system directly into the Attendance System without breaking any existing features:
1. Provide the complete database migration SQL script for Supabase.
2. Build secure, admin-gated Next.js API routes for all RFID functions (`/api/admin/rfid/*`).
3. Port and enhance the Supabase Edge Function (`device-api`) with entry auto check-in and 15-minute exit buffer logic.
4. Build the `RFIDManagement` UI tab inside the Attendance Admin Dashboard (`/admin`), strictly following the Cosmic × Vanilla design system.
5. Verify TypeScript compilation and runtime integrity.

---

## Step 1: Database Migration SQL File
- **File:** `Attendence-system-by-rushabh/supabase/migrations/002_rfid_integration.sql`
- **Contents:**
  - Create tables: `doors`, `devices`, `people`, `cards`, `access_events`, `enrollment_requests`, `remote_unlock_requests`, `access_revision`.
  - Add foreign key from `people.member_id` to `members(id)` with `ON DELETE SET NULL`.
  - Create stored procedure `device_complete_enrollment`.
  - Enable Realtime publication on `access_events`, `enrollment_requests`, `doors`, `people`, `cards`.
  - Seed default door (`code: 'main-door'`).
- **Verification:** SQL syntax and schema checks.

---

## Step 2: Next.js Admin Backend APIs (`/api/admin/rfid/*`)
All endpoints gated via `requireAdmin(request)`:
- `src/app/api/admin/rfid/overview/route.ts` - GET summary stats, active doors, enrollment status, initial 30 events.
- `src/app/api/admin/rfid/people/route.ts` - GET (list people with cards & linked members), POST (create person).
- `src/app/api/admin/rfid/people/[id]/route.ts` - PATCH (update person, toggle access, change card UID), DELETE (remove person).
- `src/app/api/admin/rfid/doors/unlock/route.ts` - POST (create remote unlock request with 20s expiry).
- `src/app/api/admin/rfid/doors/override/route.ts` - PATCH (toggle any-card mode with 2-hour expiry).
- `src/app/api/admin/rfid/enroll/route.ts` - POST (start card enrollment), DELETE (cancel active enrollment).
- **Verification:** API unit consistency and type safety.

---

## Step 3: Supabase Edge Function (`supabase/functions/device-api/index.ts`)
- Copy and upgrade the Edge Function to `Attendence-system-by-rushabh/supabase/functions/device-api/index.ts`.
- Integrate attendance session hooks:
  - **On Entry Tap (`ACCESS_GRANTED`):** Look up `people.member_id`. If set, automatically insert/resume an active session in `sessions` with default 4h target minutes.
  - **On Exit Tap (`exit`):** Look up `people.member_id`. If an open session exists, record `pending_rfid_exit_at` to trigger the 15-minute checkout buffer.
- Support all existing hardware device actions: `authorize`, `sync`, `log_batch`, `enrollment_status`, `verify_enrollment_admin`, `complete_enrollment`, `remote_unlock_status`.
- **Verification:** Code linting and protocol compatibility with ESP32 firmware.

---

## Step 4: Admin Dashboard "RFID & Door" UI Component
- **File:** `src/components/admin/RFIDManagement.tsx`
  - Native Cosmic × Vanilla design:
    - Charcoal-purple background `#1c1a24`, surface cards `#23212c`, lime/vanilla accent `#f1fec8`.
    - JetBrains Mono for monospace UIDs and dates.
    - Skeletons and loading indicators (Rule #21).
  - Summary stats (Registered People, Access Enabled, Cards Assigned).
  - Door remote unlock button with 10-second countdown cooldown.
  - Any-card event override mode toggle with auto-revert timer.
  - Live Enrollment banner with step guidance and cancellation button.
  - Add/Edit person form with "Link to Attendance Member" selector and hexadecimal UID validation (`^[0-9A-F]{8,20}$`).
  - People & Cards table with search/filter, role badge, grant/revoke toggle, enroll button, edit, and delete.
  - Real-time Access Logs table with live Supabase Realtime channel subscription.
- **Update:** `src/app/admin/page.tsx`
  - Add `'rfid'` to `activeTab` state union.
  - Add "RFID & Door" tab button with icon.
  - Render `<RFIDManagement users={users} />` inside main content area.
- **Verification:** Visual polish and responsive layout.

---

## Step 5: Build Verification & Testing
- Run `npm run build` in `Attendence-system-by-rushabh` to verify zero TypeScript errors or compilation issues.
- Document deployment and hardware configuration instructions.
