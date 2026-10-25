import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase';
import { requireAdmin } from '@/utils/session';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const [peopleRes, cardsRes, doorsRes, enrollRes, eventsRes] = await Promise.all([
      supabase.from('people').select('id, access_enabled'),
      supabase.from('cards').select('uid, active').eq('active', true),
      supabase
        .from('doors')
        .select('id, name, code, enabled, override_mode, override_expires_at, unlock_window_ms, held_open_alarm_ms')
        .order('name'),
      supabase
        .from('enrollment_requests')
        .select(`
          id,
          status,
          expires_at,
          person_id,
          people:people!enrollment_requests_person_id_fkey (
            full_name
          )
        `)
        .in('status', ['requested', 'awaiting_card'])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('access_events')
        .select(`
          id,
          created_at,
          decision,
          reason,
          uid,
          offline,
          people (
            full_name
          ),
          devices (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (doorsRes.error) {
      console.error('Error fetching doors:', doorsRes.error);
    }
    if (eventsRes.error) {
      console.error('Error fetching events:', eventsRes.error);
    }

    const people = peopleRes.data || [];
    const cards = cardsRes.data || [];
    const doors = doorsRes.data || [];
    const pendingEnrollment = enrollRes.data || null;
    const rawEvents = eventsRes.data || [];

    const events = rawEvents.map((evt) => {
      const personRel = Array.isArray(evt.people) ? evt.people[0] : evt.people;
      const deviceRel = Array.isArray(evt.devices) ? evt.devices[0] : evt.devices;
      return {
        id: evt.id,
        created_at: evt.created_at,
        decision: evt.decision,
        reason: evt.reason,
        uid: evt.uid,
        offline: evt.offline,
        person_name: personRel?.full_name || 'Unknown',
        device_name: deviceRel?.name || '—',
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        registeredPeople: people.length,
        accessEnabled: people.filter((p) => p.access_enabled).length,
        cardsAssigned: cards.length,
      },
      doors,
      pendingEnrollment,
      events,
    });
  } catch (err: unknown) {
    console.error('RFID Overview Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
