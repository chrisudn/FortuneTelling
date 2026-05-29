'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getDiaryEntryById, updateDiaryNote, type DiaryEntry } from '@/lib/diary'
import HexagramDisplay from '@/components/HexagramDisplay'

export default function DiaryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const e = getDiaryEntryById(params.id as string)
    if (!e) { router.replace('/history'); return }
    setEntry(e)
    setNote(e.note)
  }, [params.id, router])

  const handleSaveNote = () => {
    if (!entry) return
    updateDiaryNote(entry.id, note)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!entry) return null

  const YAO_NAMES = ['初', '二', '三', '四', '五', '上']

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-paper">
      {/* 返回 */}
      <button
        onClick={() => router.back()}
        className="text-inkDark/50 text-lg mb-6 text-left py-2"
      >
        ← 返回歷史
      </button>

      {/* 日期 */}
      <p className="text-inkDark/40 text-base mb-4">
        {new Date(entry.savedAt).toLocaleDateString('zh-TW', {
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
        })}
      </p>

      {/* 問題 */}
      <div className="mb-6 pb-5 border-b border-ink/10">
        <p className="text-inkDark/40 text-sm mb-1">所問之事</p>
        <p className="text-inkDark text-xl leading-relaxed">{entry.question}</p>
      </div>

      {/* 卦象 */}
      <div className="text-center mb-6">
        <HexagramDisplay
          lines={entry.mainLines}
          changingPositions={entry.changingPositions}
          size="lg"
        />
        <div className="mt-4">
          <p className="text-inkDark/40 text-sm mb-1">本卦</p>
          <p className="text-3xl font-bold text-ink">
            {entry.mainHexagramUnicode} {entry.mainHexagramName}卦
          </p>
          {entry.changedHexagramName && (
            <p className="text-inkDark/50 text-base mt-1">
              → 之卦：{entry.changedHexagramName}卦
            </p>
          )}
          {entry.hasChanges && entry.changingPositions.length > 0 && (
            <p className="text-vermilion/70 text-sm mt-1">
              動爻：{entry.changingPositions.map(p => YAO_NAMES[p] + '爻').join('、')}
            </p>
          )}
        </div>
      </div>

      {/* AI 解讀 */}
      {entry.aiFirstResponse && (
        <div className="bg-ink/5 rounded-2xl px-5 py-4 mb-6">
          <p className="text-ink text-xs font-bold tracking-widest mb-3">AI 解讀</p>
          <p className="text-inkDark text-base leading-relaxed">{entry.aiFirstResponse}</p>
        </div>
      )}

      {/* 日記心情 */}
      <div className="mb-4">
        <label className="block text-ink text-xl font-medium mb-3">
          心情日記
        </label>
        <textarea
          className="w-full rounded-xl border-2 border-ink/20 bg-white/60
                     px-4 py-4 text-xl text-inkDark leading-relaxed
                     focus:outline-none focus:border-ink
                     min-h-[140px] resize-none placeholder:text-inkDark/30"
          placeholder="記下此刻的心情與想法…"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <button
        onClick={handleSaveNote}
        className="w-full py-5 rounded-xl text-xl font-bold text-white
                   bg-ink active:scale-[0.98] transition-transform mb-8"
      >
        {saved ? '✓ 已儲存' : '儲存心情'}
      </button>
    </div>
  )
}
