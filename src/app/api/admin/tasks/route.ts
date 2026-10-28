import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/utils/session';
import { getSupabaseAdmin } from '@/utils/supabase';
import { TASK_STATUSES, type TaskStatus } from '@/utils/projects';

// This route manages direct assignments only — tasks with no project. Project tasks
// are managed through the project routes; here an admin hands a member a one-off task.
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id, title, description, status, due_date, created_at,
        assignee:members!assignee_id ( id, name, pnr_number )
      `)
      .is('project_id', null)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    const tasks = (data ?? []).map((t) => ({
      ...t,
      assignee: Array.isArray(t.assignee) ? t.assignee[0] ?? null : t.assignee,
    }));

    return NextResponse.json({ success: true, tasks });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 403 });
    }

    const body = await req.json();
    const assigneeId = typeof body.assignee_id === 'string' ? body.assignee_id : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';

    if (!assigneeId || !title) {
      return NextResponse.json({ error: 'Missing assignee_id or title' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('tasks').insert({
      assignee_id: assigneeId,
      created_by_id: admin.member_id,
      title,
      status: 'todo',
    });

    if (error) {
      return NextResponse.json({ error: 'Failed to assign task' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
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
    const taskId = typeof body.task_id === 'string' ? body.task_id : '';
    const status = body.status;

    if (!taskId || !status) {
      return NextResponse.json({ error: 'Missing task_id or status' }, { status: 400 });
    }
    if (!TASK_STATUSES.includes(status as TaskStatus)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
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

    const task_id = req.nextUrl.searchParams.get('task_id');
    if (!task_id) {
      return NextResponse.json({ error: 'Missing task_id' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    // Soft-delete to bin
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', task_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
