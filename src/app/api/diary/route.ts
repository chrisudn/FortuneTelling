import { createClient } from '@/lib/supabase/server'
import { rowToEntry } from '@/lib/supabase/diary'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limit = parseInt(new URL(request.url).searchParams.get('limit') ?? '200')

  const { data, error } = await supabase
    .from('diary_entries')
    .select()
    .order('saved_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data ?? []).map(row => rowToEntry(row as Record<string, any>)))
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from('diary_entries')
    .insert({
      user_id: user.id,
      question: body.question,
      main_hexagram_id: body.mainHexagramId,
      main_hexagram_name: body.mainHexagramName,
      main_hexagram_unicode: body.mainHexagramUnicode,
      changed_hexagram_id: body.changedHexagramId ?? null,
      changed_hexagram_name: body.changedHexagramName ?? null,
      main_lines: body.mainLines,
      changed_lines: body.changedLines,
      changing_positions: body.changingPositions,
      has_changes: body.hasChanges,
      ai_first_response: body.aiFirstResponse ?? '',
      ai_conversation: body.aiConversation ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(rowToEntry(data as Record<string, any>), { status: 201 })
}
