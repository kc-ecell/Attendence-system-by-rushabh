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
    const { door_id } = body;

    const supabase = getSupabaseAdmin();

    // If door_id not provided, pick first active door
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

    const expiresAt = new Date(Date.now() + 20_000).toISOString();

    const { error } = await supabase.from('remote_unlock_requests').insert({
      door_id: targetDoorId,
      requested_by: admin.name || admin.member_id,
      status: 'requested',
      expires_at: expiresAt,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Unlock command sent. Door will trigger within a few seconds.',
      expires_at: expiresAt,
    });
  } catch (err: unknown) {
    console.error('Remote Unlock Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
