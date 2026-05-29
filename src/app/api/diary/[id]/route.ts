import { createClient } from '@/lib/supabase/server'
import { rowToEntry } from '@/lib/supabase/diary'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('diary_entries')
    .select()
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(rowToEntry(data as Record<string, any>))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }

  if (body.aiConversation !== undefined) updates.ai_conversation = body.aiConversation
  if (body.note !== undefined) updates.note = body.note

  const { data, error } = await supabase
    .from('diary_entries')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(rowToEntry(data as Record<string, any>))
}
