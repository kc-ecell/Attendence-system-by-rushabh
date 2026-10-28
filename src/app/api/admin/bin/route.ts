import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/session';
import { getSupabaseAdmin } from '@/utils/supabase';

export type BinItemType = 'member' | 'session' | 'task' | 'calendar';

export type BinItem = {
  id: string;
  type: BinItemType;
  title: string;
  subtitle: string;
  deleted_at: string;
  days_remaining: number;
};

function getDaysRemaining(deletedAt: string): number {
  const deletedTime = new Date(deletedAt).getTime();
  const expiresTime = deletedTime + 7 * 24 * 60 * 60 * 1000;
  const diffMs = expiresTime - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Auto-purge records older than 7 days
    await Promise.allSettled([
      supabase.from('members').delete().not('deleted_at', 'is', null).lt('deleted_at', sevenDaysAgo),
      supabase.from('sessions').delete().not('deleted_at', 'is', null).lt('deleted_at', sevenDaysAgo),
      supabase.from('tasks').delete().not('deleted_at', 'is', null).lt('deleted_at', sevenDaysAgo),
      supabase.from('calendar_events').delete().not('deleted_at', 'is', null).lt('deleted_at', sevenDaysAgo),
    ]);

    // 2. Fetch soft-deleted records across all tables
    const [membersRes, sessionsRes, tasksRes, calendarRes] = await Promise.all([
      supabase
        .from('members')
        .select('id, name, email, pnr_number, role, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
      supabase
        .from('sessions')
        .select(`
          id, login_time, duration_minutes, work_description, deleted_at,
          members ( name, pnr_number )
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
      supabase
        .from('tasks')
        .select(`
          id, title, description, deleted_at,
          assignee:members!assignee_id ( name )
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
      supabase
        .from('calendar_events')
        .select('id, title, event_date, deleted_at')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false }),
    ]);

    const items: BinItem[] = [];

    // Map members
    for (const m of membersRes.data ?? []) {
      items.push({
        id: m.id,
        type: 'member',
        title: m.name,
        subtitle: `${m.email} • PNR: ${m.pnr_number} • Role: ${m.role}`,
        deleted_at: m.deleted_at,
        days_remaining: getDaysRemaining(m.deleted_at),
      });
    }

    // Map sessions
    for (const s of sessionsRes.data ?? []) {
      const member = Array.isArray(s.members) ? s.members[0] : s.members;
      items.push({
        id: s.id,
        type: 'session',
        title: `Session: ${member?.name || 'Member'} (${member?.pnr_number || 'N/A'})`,
        subtitle: `${s.duration_minutes ? `${s.duration_minutes} mins` : 'Active'} • ${new Date(s.login_time).toLocaleDateString()}`,
        deleted_at: s.deleted_at,
        days_remaining: getDaysRemaining(s.deleted_at),
      });
    }

    // Map tasks
    for (const t of tasksRes.data ?? []) {
      const assignee = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee;
      items.push({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: `Assigned to: ${assignee?.name || 'Unassigned'}`,
        deleted_at: t.deleted_at,
        days_remaining: getDaysRemaining(t.deleted_at),
      });
    }

    // Map calendar events
    for (const c of calendarRes.data ?? []) {
      items.push({
        id: c.id,
        type: 'calendar',
        title: c.title,
        subtitle: `Scheduled: ${new Date(c.event_date).toLocaleDateString()}`,
        deleted_at: c.deleted_at,
        days_remaining: getDaysRemaining(c.deleted_at),
      });
    }

    // Sort newest deleted first
    items.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

    return NextResponse.json({ success: true, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Restore items from bin (sets deleted_at = null)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const body = await req.json();
    const items = body.items as Array<{ id: string; type: BinItemType }>;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided for restore.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const restorePromises = items.map(async (item) => {
      switch (item.type) {
        case 'member':
          return supabase.from('members').update({ deleted_at: null }).eq('id', item.id);
        case 'session':
          return supabase.from('sessions').update({ deleted_at: null }).eq('id', item.id);
        case 'task':
          return supabase.from('tasks').update({ deleted_at: null }).eq('id', item.id);
        case 'calendar':
          return supabase.from('calendar_events').update({ deleted_at: null }).eq('id', item.id);
      }
    });

    await Promise.all(restorePromises);

    return NextResponse.json({ success: true, restored_count: items.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Permanently delete items from bin
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const body = await req.json();
    const items = body.items as Array<{ id: string; type: BinItemType }>;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided for permanent deletion.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const deletePromises = items.map(async (item) => {
      switch (item.type) {
        case 'member':
          return supabase.from('members').delete().eq('id', item.id);
        case 'session':
          return supabase.from('sessions').delete().eq('id', item.id);
        case 'task':
          return supabase.from('tasks').delete().eq('id', item.id);
        case 'calendar':
          return supabase.from('calendar_events').delete().eq('id', item.id);
      }
    });

    await Promise.all(deletePromises);

    return NextResponse.json({ success: true, deleted_count: items.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
