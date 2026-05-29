export interface UserProfile {
  id: string
  nickname: string
  createdAt: number
}

export interface DiaryEntry {
  id: string
  question: string
  mainHexagramId: number
  mainHexagramName: string
  mainHexagramUnicode: string
  changedHexagramId?: number
  changedHexagramName?: string
  mainLines: (0 | 1)[]
  changedLines: (0 | 1)[]
  changingPositions: number[]
  hasChanges: boolean
  aiFirstResponse: string
  aiConversation?: { role: 'user' | 'assistant'; content: string }[]
  note: string
  savedAt: number
  updatedAt: number
}

const PROFILE_KEY = 'gua_yu_profile'
const DIARY_KEY   = 'gua_yu_diary'

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// ── Profile ──────────────────────────────────────────────────────
export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(PROFILE_KEY)
  return raw ? (JSON.parse(raw) as UserProfile) : null
}

export function saveProfile(nickname: string): UserProfile {
  const profile: UserProfile = { id: genId(), nickname: nickname.trim(), createdAt: Date.now() }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  return profile
}

// ── Diary ─────────────────────────────────────────────────────────
export function getDiaryEntries(): DiaryEntry[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(DIARY_KEY)
  return raw ? (JSON.parse(raw) as DiaryEntry[]) : []
}

export function getDiaryEntryById(id: string): DiaryEntry | null {
  return getDiaryEntries().find(e => e.id === id) ?? null
}

export function saveDiaryEntry(
  data: Omit<DiaryEntry, 'id' | 'note' | 'savedAt' | 'updatedAt'>
): DiaryEntry {
  const entries = getDiaryEntries()
  const now = Date.now()
  const entry: DiaryEntry = { ...data, id: genId(), note: '', savedAt: now, updatedAt: now }
  localStorage.setItem(DIARY_KEY, JSON.stringify([entry, ...entries]))
  return entry
}

export function updateDiaryNote(id: string, note: string): void {
  const entries = getDiaryEntries()
  const idx = entries.findIndex(e => e.id === id)
  if (idx === -1) return
  entries[idx] = { ...entries[idx], note, updatedAt: Date.now() }
  localStorage.setItem(DIARY_KEY, JSON.stringify(entries))
}

export function updateDiaryEntry(id: string, updates: Partial<Omit<DiaryEntry, 'id' | 'savedAt'>>): void {
  const entries = getDiaryEntries()
  const idx = entries.findIndex(e => e.id === id)
  if (idx === -1) return
  entries[idx] = { ...entries[idx], ...updates, updatedAt: Date.now() }
  localStorage.setItem(DIARY_KEY, JSON.stringify(entries))
}
