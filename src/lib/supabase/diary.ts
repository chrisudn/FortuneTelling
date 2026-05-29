import type { DiaryEntry } from '@/lib/diary'

export function rowToEntry(row: Record<string, any>): DiaryEntry {
  return {
    id: row.id as string,
    question: row.question as string,
    mainHexagramId: row.main_hexagram_id as number,
    mainHexagramName: row.main_hexagram_name as string,
    mainHexagramUnicode: row.main_hexagram_unicode as string,
    changedHexagramId: row.changed_hexagram_id ?? undefined,
    changedHexagramName: row.changed_hexagram_name ?? undefined,
    mainLines: row.main_lines as (0 | 1)[],
    changedLines: row.changed_lines as (0 | 1)[],
    changingPositions: row.changing_positions as number[],
    hasChanges: row.has_changes as boolean,
    aiFirstResponse: row.ai_first_response as string,
    aiConversation: row.ai_conversation ?? undefined,
    note: row.note as string,
    savedAt: new Date(row.saved_at as string).getTime(),
    updatedAt: new Date(row.updated_at as string).getTime(),
  }
}
