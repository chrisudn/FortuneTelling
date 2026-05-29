'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDiaryEntries, getProfile, type DiaryEntry } from '@/lib/diary'
import NavBar from '@/components/NavBar'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  })
}

export default function HistoryPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [hasProfile, setHasProfile] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setHasProfile(!!getProfile())
    setEntries(getDiaryEntries())
    setLoaded(true)
  }, [])

  if (!loaded) return null

  if (!hasProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 pb-28 bg-paper">
        <p className="text-5xl mb-6">📜</p>
        <p className="text-ink text-2xl font-bold mb-2">尚未建立暱稱</p>
        <p className="text-inkDark/50 text-lg text-center mb-8 leading-relaxed">
          建立暱稱後，每次占卜可儲存<br />並隨時回顧
        </p>
        <button
          onClick={() => router.push('/profile')}
          className="px-8 py-5 rounded-xl text-xl font-bold text-white bg-vermilion"
        >
          前往建立暱稱
        </button>
        <NavBar />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-paper pb-28">
      <h1 className="text-3xl font-bold text-ink mb-6">占卜歷史</h1>

      {entries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-inkDark/40 text-xl">尚無占卜紀錄</p>
          <button
            onClick={() => router.push('/')}
            className="text-vermilion text-lg font-medium mt-2"
          >
            前往起卦 →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map(entry => (
            <button
              key={entry.id}
              onClick={() => router.push(`/history/${entry.id}`)}
              className="w-full text-left bg-white/60 border border-ink/8
                         rounded-2xl p-4 active:bg-ink/5 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl mt-0.5 flex-shrink-0 leading-none">
                  {entry.mainHexagramUnicode}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-ink font-bold text-lg">
                      {entry.mainHexagramName}卦
                    </span>
                    {entry.changedHexagramName && (
                      <span className="text-inkDark/60 text-base flex-shrink-0">
                        → {entry.changedHexagramName}卦
                      </span>
                    )}
                  </div>
                  <p className="text-inkDark/60 text-base truncate">{entry.question}</p>
                  <p className="text-inkDark/60 text-base mt-1">{formatDate(entry.savedAt)}</p>
                </div>
              </div>
              {entry.note && (
                <p className="mt-3 pt-3 border-t border-ink/8 text-inkDark/50 text-base line-clamp-1">
                  📝 {entry.note}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      <NavBar />
    </div>
  )
}
