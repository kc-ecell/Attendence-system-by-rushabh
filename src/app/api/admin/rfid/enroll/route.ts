import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase';
import { requireAdmin } from '@/utils/session';

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { person_id, door_id } = body;

    if (!person_id) {
      return NextResponse.json({ error: 'Missing person_id' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    let targetDoorId = door_id;
    if (!targetDoorId) {
      const { data: firstDoor } = await supabase
        .from('doors')
        .select('id')
        .eq('enabled', true)
        .limit(1)
        .maybeSingle();

      if (!firstDoor) {
        return NextResponse.json({ error: 'No active doors found' }, { status: 404 });
      }
      targetDoorId = firstDoor.id;
    }

    // Cancel any existing active enrollment requests
    await supabase
      .from('enrollment_requests')
      .update({ status: 'cancelled' })
      .in('status', ['requested', 'awaiting_card']);

    const expiresAt = new Date(Date.now() + 120_000).toISOString();

    const { data: enrollment, error } = await supabase
      .from('enrollment_requests')
      .insert({
        person_id,
        door_id: targetDoorId,
        requested_by: admin.name || admin.member_id,
        status: 'requested',
        expires_at: expiresAt,
      })
      .select('id, expires_at, status')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, enrollment });
  } catch (err: unknown) {
    console.error('Enroll Request POST Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');

    const supabase = getSupabaseAdmin();

    const query = supabase
      .from('enrollment_requests')
      .update({ status: 'cancelled' });

    if (requestId) {
      query.eq('id', requestId);
    } else {
      query.in('status', ['requested', 'awaiting_card']);
    }

    const { error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Enroll Request DELETE Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
