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

    const { data: people, error } = await supabase
      .from('people')
      .select(`
        id,
        member_id,
        full_name,
        class_name,
        division,
        academic_year,
        role,
        access_enabled,
        notes,
        created_at,
        cards (
          uid,
          active
        ),
        members (
          id,
          name,
          email,
          pnr_number
        )
      `)
      .order('full_name');

    if (error) {
      console.error('Error fetching RFID people:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (people || []).map((p) => {
      const cardList = Array.isArray(p.cards) ? p.cards : p.cards ? [p.cards] : [];
      const primaryCard = cardList[0] || null;
      const memberRel = Array.isArray(p.members) ? p.members[0] : p.members;
      return {
        id: p.id,
        member_id: p.member_id,
        full_name: p.full_name,
        class_name: p.class_name,
        division: p.division,
        academic_year: p.academic_year,
        role: p.role,
        access_enabled: p.access_enabled,
        notes: p.notes,
        created_at: p.created_at,
        card: primaryCard,
        member: memberRel || null,
      };
    });

    return NextResponse.json({ success: true, people: formatted });
  } catch (err: unknown) {
    console.error('RFID People GET Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      full_name,
      class_name = '',
      division = '',
      academic_year = '',
      role = 'member',
      notes = '',
      member_id = null,
      uid = '',
    } = body;

    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    const cleanUid = String(uid || '')
      .replace(/[^0-9a-f]/gi, '')
      .toUpperCase();

    if (cleanUid && !/^[0-9A-F]{8,20}$/.test(cleanUid)) {
      return NextResponse.json(
        { error: 'Card UID must be 8–20 hexadecimal characters' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 1. Insert person
    const { data: newPerson, error: personError } = await supabase
      .from('people')
      .insert({
        full_name: full_name.trim(),
        class_name: String(class_name).trim(),
        division: String(division).trim(),
        academic_year: String(academic_year).trim(),
        role: role === 'admin' ? 'admin' : 'member',
        notes: String(notes).trim(),
        member_id: member_id || null,
        created_by: admin.name || admin.member_id,
      })
      .select('id')
      .single();

    if (personError) {
      return NextResponse.json({ error: personError.message }, { status: 500 });
    }

    // 2. If UID provided, insert card
    if (cleanUid) {
      const { error: cardError } = await supabase
        .from('cards')
        .insert({
          uid: cleanUid,
          person_id: newPerson.id,
          active: true,
          created_by: admin.name || admin.member_id,
        });

      if (cardError) {
        return NextResponse.json({
          success: true,
          person_id: newPerson.id,
          warning: `Person added, but card binding failed: ${cardError.message}`,
        });
      }
    }

    return NextResponse.json({ success: true, person_id: newPerson.id });
  } catch (err: unknown) {
    console.error('RFID People POST Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
