import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase';
import { requireAdmin } from '@/utils/session';

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { door_id, enabled } = body;

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

    const nextMode = Boolean(enabled);
    const expiresAt = nextMode ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() : null;

    const { error } = await supabase
      .from('doors')
      .update({
        override_mode: nextMode,
        override_expires_at: expiresAt,
      })
      .eq('id', targetDoorId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      override_mode: nextMode,
      override_expires_at: expiresAt,
    });
  } catch (err: unknown) {
    console.error('Door Override Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
