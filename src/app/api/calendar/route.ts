import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    // Anyone can view the calendar events (active only)
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, title, event_date')
      .is('deleted_at', null)
      .order('event_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
    }

    return NextResponse.json({ success: true, events: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
