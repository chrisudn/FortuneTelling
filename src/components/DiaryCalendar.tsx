'use client'
import type { DiaryEntry } from '@/lib/diary'

const WEEK_HEADERS = ['日', '一', '二', '三', '四', '五', '六']

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

interface DiaryCalendarProps {
  entries: DiaryEntry[]
  currentMonth: Date
  selectedDate: string | null
  onMonthChange: (month: Date) => void
  onSelectDate: (date: string | null) => void
}

export default function DiaryCalendar({
  entries,
  currentMonth,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: DiaryCalendarProps) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0=Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = localDateKey(new Date())

  // Group all entries by local date key
  const entriesByDate: Record<string, DiaryEntry[]> = {}
  entries.forEach(entry => {
    const key = localDateKey(new Date(entry.savedAt))
    if (!entriesByDate[key]) entriesByDate[key] = []
    entriesByDate[key].push(entry)
  })

  const handleDayClick = (day: number) => {
    const key = `${year}-${month}-${day}`
    if (!entriesByDate[key]) return
    onSelectDate(selectedDate === key ? null : key)
  }

  const handlePrevMonth = () => {
    onSelectDate(null)
    onMonthChange(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    onSelectDate(null)
    onMonthChange(new Date(year, month + 1, 1))
  }

  // Build cell array: leading empty + day numbers + trailing empty to fill last row
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          aria-label="上個月"
          className="w-9 h-9 flex items-center justify-center rounded-lg
                     text-inkDark/40 text-2xl active:bg-ink/5 transition-colors"
        >
          ‹
        </button>
        <span className="text-ink font-bold text-lg">
          {year}年{month + 1}月
        </span>
        <button
          onClick={handleNextMonth}
          aria-label="下個月"
          className="w-9 h-9 flex items-center justify-center rounded-lg
                     text-inkDark/40 text-2xl active:bg-ink/5 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_HEADERS.map(h => (
          <div key={h} className="text-center text-inkDark/30 text-xs py-1 font-medium">
            {h}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="min-h-[50px]" />

          const key = `${year}-${month}-${day}`
          const dayEntries = entriesByDate[key] ?? []
          const hasEntries = dayEntries.length > 0
          const isToday = key === todayKey
          const isSelected = selectedDate === key

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              disabled={!hasEntries}
              className={`flex flex-col items-center justify-center min-h-[50px]
                          rounded-xl mx-0.5 transition-colors disabled:cursor-default
                          ${isSelected
                            ? 'bg-ink'
                            : isToday
                              ? 'bg-vermilion/10'
                              : hasEntries
                                ? 'active:bg-ink/5'
                                : ''
                          }`}
            >
              <span className={`text-xs leading-none mb-1
                ${isSelected ? 'text-white/60'
                  : isToday ? 'text-vermilion font-bold'
                  : hasEntries ? 'text-inkDark/70'
                  : 'text-inkDark/25'}`}>
                {day}
              </span>
              {hasEntries && (
                <span className="relative inline-flex items-start">
                  <span className={`text-base leading-none
                    ${isSelected ? 'text-white' : 'text-inkDark'}`}>
                    {dayEntries[0].mainHexagramUnicode}
                  </span>
                  {dayEntries.length > 1 && (
                    <span className={`ml-0.5 text-[9px] leading-none mt-px
                      ${isSelected ? 'text-white/60' : 'text-inkDark/40'}`}>
                      {dayEntries.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
