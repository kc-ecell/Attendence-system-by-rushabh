import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase';

// CORS headers for pre-flight and responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'apikey, content-type, x-device-id, x-device-secret, x-firmware-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export async function OPTIONS() {
  return new NextResponse('ok', { headers: corsHeaders });
}

function normalizeUid(value: unknown): string {
  return String(value ?? '').replace(/[^0-9a-f]/gi, '').toUpperCase();
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Sweeps and seals expired sessions where member tapped exit reader > 15 min ago
 * without entering a manual work description.
 */
async function sealExpiredExitBuffers() {
  try {
    const supabase = getSupabaseAdmin();
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: expiredSessions } = await supabase
      .from('sessions')
      .select('id, login_time, pending_rfid_exit_at')
      .is('logout_time', null)
      .not('pending_rfid_exit_at', 'is', null)
      .lte('pending_rfid_exit_at', fifteenMinAgo);

    if (expiredSessions && expiredSessions.length > 0) {
      for (const s of expiredSessions) {
        const exitTime = new Date(s.pending_rfid_exit_at!).getTime();
        const loginTime = new Date(s.login_time).getTime();
        const duration = Math.max(0, Math.floor((exitTime - loginTime) / (1000 * 60)));

        await supabase
          .from('sessions')
          .update({
            logout_time: s.pending_rfid_exit_at,
            duration_minutes: duration,
            logout_type: 'rfid_auto',
            work_description: 'Checked out via door RFID exit',
            pending_rfid_exit_at: null,
          })
          .eq('id', s.id);
      }
    }
  } catch (err) {
    console.error('Error sweeping expired exit buffers:', err);
  }
}

export async function POST(request: Request) {
  try {
    const deviceId = request.headers.get('x-device-id') ?? '';
    const deviceSecret = request.headers.get('x-device-secret') ?? '';

    if (!/^[0-9a-f-]{36}$/i.test(deviceId) || deviceSecret.length < 32) {
      return NextResponse.json({ ok: false, error: 'DEVICE_AUTH_REQUIRED' }, { status: 401, headers: corsHeaders });
    }

    const supabase = getSupabaseAdmin();

    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, door_id, secret_sha256, enabled, doors!inner(id, enabled, unlock_window_ms, held_open_alarm_ms, override_mode, override_unlock_window_ms, override_expires_at)')
      .eq('id', deviceId)
      .maybeSingle();

    const suppliedHash = await sha256Hex(deviceSecret);

    if (
      deviceError ||
      !device ||
      !device.enabled ||
      !constantTimeEqual(suppliedHash, device.secret_sha256)
    ) {
      return NextResponse.json({ ok: false, error: 'DEVICE_AUTH_FAILED' }, { status: 401, headers: corsHeaders });
    }

    const door = Array.isArray(device.doors) ? device.doors[0] : device.doors;
    if (!door?.enabled) {
      return NextResponse.json({ ok: false, error: 'DOOR_DISABLED' }, { status: 403, headers: corsHeaders });
    }

    let overrideActive = false;
    if (door.override_mode) {
      const expired = !door.override_expires_at || new Date(door.override_expires_at) <= new Date();
      if (expired) {
        await supabase.from('doors').update({ override_mode: false }).eq('id', door.id);
      } else {
        overrideActive = true;
      }
    }
    const effectiveUnlockWindowMs = overrideActive ? door.override_unlock_window_ms : door.unlock_window_ms;

    // Update last seen
    await supabase
      .from('devices')
      .update({
        last_seen_at: new Date().toISOString(),
        firmware_version: request.headers.get('x-firmware-version'),
      })
      .eq('id', device.id);

    // Run background 15-minute buffer check
    sealExpiredExitBuffers();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400, headers: corsHeaders });
    }

    const action = String(body.action ?? '');

    // 1. Authorize card tap
    if (action === 'authorize') {
      const uid = normalizeUid(body.uid);
      if (!/^[0-9A-F]{8,20}$/.test(uid)) {
        return NextResponse.json({ ok: false, granted: false, reason: 'INVALID_UID' }, { status: 400, headers: corsHeaders });
      }

      const { data: card } = await supabase
        .from('cards')
        .select('uid, active, person_id')
        .eq('uid', uid)
        .maybeSingle();

      let person: { id: string; member_id: string | null; full_name: string; role: string; access_enabled: boolean } | null = null;
      if (card?.person_id) {
        const { data: personData } = await supabase
          .from('people')
          .select('id, member_id, full_name, role, access_enabled')
          .eq('id', card.person_id)
          .maybeSingle();
        person = personData;
      }

      const direction = body.direction === 'exit' ? 'exit' : 'entry';
      let granted = Boolean(card?.active && person?.access_enabled);
      let reason = !card
        ? 'UNKNOWN_CARD'
        : !card.active
        ? 'CARD_DISABLED'
        : !person
        ? 'PERSON_MISSING'
        : !person.access_enabled
        ? 'ACCESS_REVOKED'
        : 'ACCESS_GRANTED';

      if (!granted && overrideActive) {
        granted = true;
        reason = 'ANY_CARD_OVERRIDE';
      }

      const decision = granted ? (direction === 'exit' ? 'exit' : 'granted') : 'denied';

      await supabase.from('access_events').insert({
        door_id: device.door_id,
        device_id: device.id,
        person_id: person?.id ?? null,
        uid,
        decision,
        reason,
        offline: false,
      });

      // Attendance auto check-in / exit buffer hook
      if (granted && person?.member_id) {
        if (direction === 'entry') {
          // Check for today's active session
          const { data: existingSession } = await supabase
            .from('sessions')
            .select('id')
            .eq('member_id', person.member_id)
            .is('logout_time', null)
            .limit(1)
            .maybeSingle();

          if (!existingSession) {
            await supabase.from('sessions').insert({
              member_id: person.member_id,
              login_time: new Date().toISOString(),
              target_minutes: 240,
              otp_used: 'RFID_ENTRY',
            });
          }
        } else if (direction === 'exit') {
          // Exit tap: set 15-minute buffer marker
          const { data: activeSession } = await supabase
            .from('sessions')
            .select('id')
            .eq('member_id', person.member_id)
            .is('logout_time', null)
            .order('login_time', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (activeSession) {
            await supabase
              .from('sessions')
              .update({
                pending_rfid_exit_at: new Date().toISOString(),
              })
              .eq('id', activeSession.id);
          }
        }
      }

      return NextResponse.json({
        ok: true,
        granted,
        reason,
        direction,
        person: person ? { id: person.id, name: person.full_name, role: person.role } : null,
        unlock_window_ms: effectiveUnlockWindowMs,
        server_time: new Date().toISOString(),
      }, { headers: corsHeaders });
    }

    // 2. Sync allow-list for offline hardware cache
    if (action === 'sync') {
      const [{ data: rows, error: cardsError }, { data: revision }] = await Promise.all([
        supabase
          .from('cards')
          .select('uid, people!inner(id, full_name, role, access_enabled)')
          .eq('active', true)
          .eq('people.access_enabled', true),
        supabase.from('access_revision').select('value').eq('singleton', true).single(),
      ]);

      if (cardsError) throw cardsError;

      const cards = (rows ?? []).map((row) => {
        const personRel = Array.isArray(row.people) ? row.people[0] : row.people;
        return {
          uid: row.uid,
          person_id: personRel.id,
          name: personRel.full_name,
          role: personRel.role,
        };
      });

      return NextResponse.json({
        ok: true,
        revision: Number(revision?.value ?? 1),
        server_time: new Date().toISOString(),
        unlock_window_ms: effectiveUnlockWindowMs,
        held_open_alarm_ms: door.held_open_alarm_ms,
        cards,
      }, { headers: corsHeaders });
    }

    // 3. Batch upload offline events recorded while disconnected
    if (action === 'log_batch') {
      const events = Array.isArray(body.events) ? body.events.slice(0, 50) : [];
      const allowed = new Set([
        'granted', 'denied', 'exit', 'door_opened', 'door_closed',
        'door_held_open', 'enrollment_success', 'enrollment_failed',
      ]);

      const rows = events
        .filter((event) => event && typeof event === 'object' && allowed.has(String(event.decision)))
        .map((event) => ({
          event_uuid: String(event.event_uuid),
          door_id: device.door_id,
          device_id: device.id,
          person_id: event.person_id || null,
          uid: event.uid ? normalizeUid(event.uid) : null,
          decision: event.decision,
          reason: String(event.reason ?? '').slice(0, 200),
          offline: Boolean(event.offline),
          device_time: event.device_time ? String(event.device_time).slice(0, 80) : null,
          metadata: typeof event.metadata === 'object' ? event.metadata : {},
        }));

      if (rows.length) {
        const { error } = await supabase.from('access_events').upsert(rows, {
          onConflict: 'event_uuid',
          ignoreDuplicates: true,
        });
        if (error) throw error;
      }

      return NextResponse.json({ ok: true, accepted: rows.length }, { headers: corsHeaders });
    }

    // 4. Check enrollment status
    if (action === 'enrollment_status') {
      const { data: enrollment, error } = await supabase
        .from('enrollment_requests')
        .select('id, status, expires_at, person_id, people:people!enrollment_requests_person_id_fkey(full_name)')
        .eq('door_id', device.door_id)
        .in('status', ['requested', 'awaiting_card'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!enrollment) {
        return NextResponse.json({ ok: true, active: false }, { headers: corsHeaders });
      }

      const personRel = Array.isArray(enrollment.people) ? enrollment.people[0] : enrollment.people;
      return NextResponse.json({
        ok: true,
        active: true,
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          expires_at: enrollment.expires_at,
          person_id: enrollment.person_id,
          person_name: personRel?.full_name ?? 'Unknown',
        },
      }, { headers: corsHeaders });
    }

    // 5. Verify enrollment supervisor admin card
    if (action === 'verify_enrollment_admin') {
      const uid = normalizeUid(body.uid);
      const requestId = String(body.request_id ?? '');

      const { data: enrollment } = await supabase
        .from('enrollment_requests')
        .select('id, status')
        .eq('id', requestId)
        .eq('door_id', device.door_id)
        .in('status', ['requested', 'awaiting_card'])
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!enrollment) {
        return NextResponse.json({ ok: true, verified: false, reason: 'ENROLLMENT_NOT_READY' }, { headers: corsHeaders });
      }

      const { data: card } = await supabase
        .from('cards')
        .select('person_id, active')
        .eq('uid', uid)
        .maybeSingle();

      const { data: person } = card?.person_id
        ? await supabase.from('people').select('id, full_name, role, access_enabled').eq('id', card.person_id).maybeSingle()
        : { data: null };

      const verified = Boolean(card?.active && person?.access_enabled && person?.role === 'admin');
      if (!verified) {
        return NextResponse.json({ ok: true, verified: false, reason: 'ADMIN_BADGE_REQUIRED' }, { headers: corsHeaders });
      }

      const expiresAt = new Date(Date.now() + 30_000).toISOString();
      const { error } = await supabase.from('enrollment_requests').update({
        status: 'awaiting_card',
        admin_person_id: person!.id,
        expires_at: expiresAt,
      }).eq('id', requestId).eq('status', 'requested');

      if (error) throw error;

      return NextResponse.json({
        ok: true,
        verified: true,
        admin_name: person!.full_name,
        expires_at: expiresAt,
      }, { headers: corsHeaders });
    }

    // 6. Complete enrollment with new card
    if (action === 'complete_enrollment') {
      const uid = normalizeUid(body.uid);
      const requestId = String(body.request_id ?? '');

      const { data, error } = await supabase.rpc('device_complete_enrollment', {
        p_device_id: device.id,
        p_request_id: requestId,
        p_uid: uid,
      });

      if (error) {
        await supabase.from('access_events').insert({
          door_id: device.door_id,
          device_id: device.id,
          uid,
          decision: 'enrollment_failed',
          reason: error.message,
        });
        return NextResponse.json({ ok: true, enrolled: false, reason: error.message }, { headers: corsHeaders });
      }

      await supabase.from('access_events').insert({
        door_id: device.door_id,
        device_id: device.id,
        person_id: data.person_id,
        uid: data.uid,
        decision: 'enrollment_success',
        reason: 'ADMIN_VERIFIED_ENROLLMENT',
      });

      return NextResponse.json({ ok: true, enrolled: true, uid: data.uid, person_id: data.person_id }, { headers: corsHeaders });
    }

    // 7. Check remote unlock trigger
    if (action === 'remote_unlock_status') {
      const nowIso = new Date().toISOString();
      const { data: req, error } = await supabase
        .from('remote_unlock_requests')
        .select('id, expires_at')
        .eq('door_id', device.door_id)
        .eq('status', 'requested')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!req) {
        return NextResponse.json({ ok: true, active: false }, { headers: corsHeaders });
      }

      // Mark request completed
      await supabase
        .from('remote_unlock_requests')
        .update({ status: 'completed', completed_at: nowIso })
        .eq('id', req.id);

      await supabase.from('access_events').insert({
        door_id: device.door_id,
        device_id: device.id,
        decision: 'granted',
        reason: 'REMOTE_UNLOCK',
        offline: false,
      });

      return NextResponse.json({
        ok: true,
        active: true,
        unlock_window_ms: effectiveUnlockWindowMs,
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ ok: false, error: 'UNKNOWN_ACTION' }, { status: 400, headers: corsHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Device API Error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
}
