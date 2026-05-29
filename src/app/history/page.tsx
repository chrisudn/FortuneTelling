'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getDiaryEntries, getProfile, type DiaryEntry } from '@/lib/diary'
import NavBar from '@/components/NavBar'
import DiaryCalendar from '@/components/DiaryCalendar'

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

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
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    setHasProfile(!!getProfile())
    setEntries(getDiaryEntries())
    setLoaded(true)
  }, [])

  // Entries within the current calendar month
  const monthEntries = useMemo(() =>
    entries.filter(e => {
      const d = new Date(e.savedAt)
      return d.getFullYear() === currentMonth.getFullYear()
        && d.getMonth() === currentMonth.getMonth()
    }),
  [entries, currentMonth])

  // Entries shown in the list below the calendar
  const listEntries = useMemo(() => {
    if (!selectedDate) return monthEntries
    return entries.filter(e =>
      localDateKey(new Date(e.savedAt)) === selectedDate
    )
  }, [entries, monthEntries, selectedDate])

  // Label for the divider between calendar and list
  const listLabel = useMemo(() => {
    if (!selectedDate) {
      return `${currentMonth.getMonth() + 1}月　共 ${monthEntries.length} 筆`
    }
    const [y, m, d] = selectedDate.split('-').map(Number)
    const label = new Date(y, m, d).toLocaleDateString('zh-TW', {
      month: 'long', day: 'numeric',
    })
    return `${label}　共 ${listEntries.length} 筆`
  }, [selectedDate, currentMonth, monthEntries.length, listEntries.length])

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
    <div className="flex flex-col min-h-screen px-5 py-6 bg-paper pb-28">

      {/* 頁面標題 */}
      <h1 className="text-2xl font-bold text-ink mb-4">占卜日記</h1>

      {/* 月曆 */}
      <div className="mb-4">
        <DiaryCalendar
          entries={entries}
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onMonthChange={setCurrentMonth}
          onSelectDate={setSelectedDate}
        />
      </div>

      {/* 分隔 + 統計 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-ink/10" />
        <span className="text-inkDark/40 text-sm whitespace-nowrap">{listLabel}</span>
        <div className="flex-1 h-px bg-ink/10" />
      </div>

      {/* 記錄列表 */}
      {listEntries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-inkDark/30 text-base">
            {selectedDate ? '此日無占卜紀錄' : '本月尚無占卜紀錄'}
          </p>
          {!selectedDate && entries.length === 0 && (
            <button
              onClick={() => router.push('/')}
              className="text-vermilion text-base font-medium"
            >
              前往起卦 →
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listEntries.map(entry => (
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
                  <p className="text-inkDark/40 text-sm mt-1">{formatDate(entry.savedAt)}</p>
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
