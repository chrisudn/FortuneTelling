import type { CastLine } from './casting'

export interface CastSession {
  question: string
  castLines: CastLine[]
  mainLines: (0 | 1)[]
  changedLines: (0 | 1)[]
  changingPositions: number[]
  hasChanges: boolean
  timestamp: number
}

const SESSION_KEY = 'gua_yu_cast'

export function saveCastSession(data: Omit<CastSession, 'timestamp'>): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, timestamp: Date.now() }))
}

export function loadCastSession(): CastSession | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as CastSession
  } catch {
    return null
  }
}
