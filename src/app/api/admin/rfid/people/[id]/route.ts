import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase';
import { requireAdmin } from '@/utils/session';

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: personId } = await props.params;
    if (!personId) {
      return NextResponse.json({ error: 'Missing person ID' }, { status: 400 });
    }

    const body = await request.json();
    const supabase = getSupabaseAdmin();

    // Check if toggling access_enabled only
    if (typeof body.access_enabled === 'boolean' && Object.keys(body).length === 1) {
      const { error } = await supabase
        .from('people')
        .update({ access_enabled: body.access_enabled })
        .eq('id', personId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Full update
    const updateData: Record<string, unknown> = {};
    if (body.full_name !== undefined) updateData.full_name = String(body.full_name).trim();
    if (body.class_name !== undefined) updateData.class_name = String(body.class_name).trim();
    if (body.division !== undefined) updateData.division = String(body.division).trim();
    if (body.academic_year !== undefined) updateData.academic_year = String(body.academic_year).trim();
    if (body.role !== undefined) updateData.role = body.role === 'admin' ? 'admin' : 'member';
    if (body.notes !== undefined) updateData.notes = String(body.notes).trim();
    if (body.member_id !== undefined) updateData.member_id = body.member_id || null;
    if (typeof body.access_enabled === 'boolean') updateData.access_enabled = body.access_enabled;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', personId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // Check UID update if provided
    if (body.uid !== undefined) {
      const newUid = String(body.uid || '')
        .replace(/[^0-9a-f]/gi, '')
        .toUpperCase();

      if (newUid && !/^[0-9A-F]{8,20}$/.test(newUid)) {
        return NextResponse.json(
          { error: 'Card UID must be 8–20 hexadecimal characters' },
          { status: 400 }
        );
      }

      // Fetch existing card for this person
      const { data: existingCards } = await supabase
        .from('cards')
        .select('uid')
        .eq('person_id', personId);

      const oldUid = existingCards?.[0]?.uid;

      if (oldUid && !newUid) {
        // Remove card
        await supabase.from('cards').delete().eq('uid', oldUid);
      } else if (oldUid && newUid !== oldUid) {
        // Change UID
        await supabase.from('cards').update({ uid: newUid }).eq('uid', oldUid);
      } else if (!oldUid && newUid) {
        // Assign new card
        await supabase.from('cards').insert({
          uid: newUid,
          person_id: personId,
          active: true,
          created_by: admin.name || admin.member_id,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('RFID Person PATCH Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: personId } = await props.params;
    if (!personId) {
      return NextResponse.json({ error: 'Missing person ID' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify person exists and access is revoked first
    const { data: person, error: findError } = await supabase
      .from('people')
      .select('access_enabled')
      .eq('id', personId)
      .maybeSingle();

    if (findError || !person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    if (person.access_enabled) {
      return NextResponse.json(
        { error: 'Revoke door access before deleting this person' },
        { status: 400 }
      );
    }

    // Cascade delete person and their assigned cards
    const { error: deleteError } = await supabase.from('people').delete().eq('id', personId);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('RFID Person DELETE Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
