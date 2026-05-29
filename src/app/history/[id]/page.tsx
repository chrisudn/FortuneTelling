'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getDiaryEntryById, updateDiaryNote, type DiaryEntry } from '@/lib/diary'
import { getHexagramById, type Hexagram } from '@/lib/hexagram'
import HexagramDisplay from '@/components/HexagramDisplay'
import TrigramBadges from '@/components/TrigramBadges'
import Toast, { useToast } from '@/components/Toast'

const YAO_NAMES = ['初', '二', '三', '四', '五', '上']

export default function DiaryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [mainHex, setMainHex] = useState<Hexagram | null>(null)
  const [changedHex, setChangedHex] = useState<Hexagram | null>(null)
  const [note, setNote] = useState('')
  const [showConversation, setShowConversation] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const e = getDiaryEntryById(params.id as string)
    if (!e) { router.replace('/history'); return }
    setEntry(e)
    setNote(e.note)
    setMainHex(getHexagramById(e.mainHexagramId) ?? null)
    if (e.changedHexagramId) {
      setChangedHex(getHexagramById(e.changedHexagramId) ?? null)
    }
  }, [params.id, router])

  const handleSaveNote = () => {
    if (!entry) return
    updateDiaryNote(entry.id, note)
    toast.show('✓ 心情已儲存')
  }

  if (!entry) return null

  const changingYaoCi = mainHex
    ? entry.changingPositions.map(pos => mainHex.yaoCi[pos]).filter(Boolean)
    : []

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-paper pb-12">

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

      {/* 本卦卦象 */}
      <div className="text-center mb-6">
        <HexagramDisplay
          lines={entry.mainLines}
          changingPositions={entry.changingPositions}
          size="lg"
        />
        <div className="mt-4">
          <p className="text-inkDark/40 text-sm mb-1">
            {mainHex?.altName ?? '本卦'}
          </p>
          <p className="text-3xl font-bold text-ink mb-1">
            {entry.mainHexagramUnicode} {entry.mainHexagramName}卦
          </p>
          {mainHex && (
            <>
              <p className="text-inkDark/50 text-base mb-2">{mainHex.keyword}</p>
              <TrigramBadges upper={mainHex.upperTrigram} lower={mainHex.lowerTrigram} />
            </>
          )}
        </div>
      </div>

      {/* 卦辭 */}
      {mainHex && (
        <div className="bg-ink/5 rounded-2xl px-5 py-4 mb-4">
          <p className="text-ink text-sm font-bold tracking-widest mb-2">卦　辭</p>
          <p className="text-inkDark text-xl leading-relaxed">{mainHex.guaCi}</p>
        </div>
      )}

      {/* 大象傳 */}
      {mainHex && (
        <div className="px-1 mb-5">
          <p className="text-inkDark/60 text-sm tracking-widest mb-1">大象傳</p>
          <p className="text-inkDark/70 text-base leading-relaxed">{mainHex.image}</p>
        </div>
      )}

      {/* 動爻爻辭 */}
      {entry.hasChanges && changingYaoCi.length > 0 && (
        <div className="border-2 border-vermilion/25 rounded-2xl px-5 py-4 mb-4 bg-vermilion/5">
          <p className="text-vermilion text-sm font-bold tracking-widest mb-3">
            動　爻（{entry.changingPositions.map(p => YAO_NAMES[p] + '爻').join('、')}）
          </p>
          <div className="flex flex-col gap-3">
            {changingYaoCi.map((yao, i) => (
              <div key={i}>
                <span className="text-vermilion font-bold text-base">{yao.position}　</span>
                <span className="text-inkDark text-base leading-relaxed">{yao.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 之卦 */}
      {changedHex && (
        <div className="bg-ink/5 rounded-2xl px-5 py-4 mb-4">
          <p className="text-ink text-sm font-bold tracking-widest mb-3">之　卦（變後走向）</p>

          <div className="flex items-center gap-5 mb-3">
            <HexagramDisplay lines={entry.changedLines} size="sm" />
            <div>
              <p className="text-2xl font-bold text-ink">
                {changedHex.unicode} {changedHex.name}卦
              </p>
              <p className="text-inkDark/60 text-base mt-0.5">{changedHex.keyword}</p>
              <div className="mt-1.5">
                <TrigramBadges
                  upper={changedHex.upperTrigram}
                  lower={changedHex.lowerTrigram}
                  size="sm"
                />
              </div>
            </div>
          </div>

          <p className="text-inkDark/80 text-base leading-relaxed mb-3">{changedHex.guaCi}</p>

          <div className="border-t border-ink/10 pt-3 mb-3">
            <p className="text-inkDark/40 text-sm tracking-widest mb-1">大象傳</p>
            <p className="text-inkDark/70 text-base leading-relaxed">{changedHex.image}</p>
          </div>

          {entry.changingPositions.length > 0 && (
            <div className="border-t border-ink/10 pt-3">
              <p className="text-vermilion text-sm font-bold tracking-widest mb-2">
                動爻在之卦（{entry.changingPositions.map(p => YAO_NAMES[p] + '爻').join('、')}）
              </p>
              <div className="flex flex-col gap-2">
                {entry.changingPositions.map(pos => {
                  const yao = changedHex.yaoCi[pos]
                  if (!yao) return null
                  return (
                    <div key={pos}>
                      <span className="text-vermilion font-bold text-base">{yao.position}　</span>
                      <span className="text-inkDark text-base leading-relaxed">{yao.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI 解讀（第一輪） */}
      {entry.aiFirstResponse && (
        <div className="bg-ink/5 rounded-2xl px-5 py-4 mb-4">
          <p className="text-ink text-sm font-bold tracking-widest mb-3">AI 解讀</p>
          <p className="text-inkDark text-base leading-relaxed">{entry.aiFirstResponse}</p>
        </div>
      )}

      {/* 完整 AI 對話（折疊） */}
      {entry.aiConversation && entry.aiConversation.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowConversation(v => !v)}
            className="w-full py-3 rounded-xl text-base font-medium text-ink
                       border-2 border-ink/15 active:bg-ink/5 transition-colors"
          >
            {showConversation
              ? '收起完整對話 ▲'
              : `展開完整對話（${entry.aiConversation.length} 則）▼`}
          </button>

          {showConversation && (
            <div className="mt-3 flex flex-col gap-3">
              {entry.aiConversation.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-ink text-white rounded-br-sm'
                      : 'bg-white/80 text-inkDark border border-ink/10 rounded-bl-sm'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 心情日記 */}
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
        儲存心情
      </button>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
