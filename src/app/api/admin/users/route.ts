import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/session';
import { getSupabaseAdmin } from '@/utils/supabase';

const EDITABLE_FIELDS = ['name', 'pnr_number', 'branch_id', 'year_id', 'position_id', 'status', 'role'] as const;

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('members')
      .select(`
        id, name, email, phone_number, pnr_number, status, role, created_at, deleted_at,
        branch:branches ( id, name ),
        year:years ( id, name ),
        position:positions ( id, name )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ success: true, users: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // When promoting to admin, sync/ensure user exists in auth.users so magic links work
    if (updates.role === 'admin') {
      try {
        const { data: member } = await supabase
          .from('members')
          .select('name, email')
          .eq('id', user_id)
          .maybeSingle();

        if (member?.email) {
          const { data: userList } = await supabase.auth.admin.listUsers();
          const existsInAuth = userList?.users?.some(
            (u) => u.email?.toLowerCase() === member.email.toLowerCase(),
          );

          if (!existsInAuth) {
            await supabase.auth.admin.createUser({
              email: member.email,
              email_confirm: true,
              user_metadata: { name: member.name || member.email.split('@')[0] },
            });
          }
        }
      } catch (authErr) {
        console.warn('Could not auto-create auth.users entry during promotion:', authErr);
      }
    }

    const { error } = await supabase
      .from('members')
      .update(updates)
      .eq('id', user_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    if (userId === admin.member_id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    // Soft-delete to bin
    const { error } = await supabase
      .from('members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: 'Failed to move user to bin' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
