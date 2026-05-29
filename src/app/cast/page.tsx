'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { castHexagram, type CastLine, type CastResult, type LineType } from '@/lib/casting'
import { saveCastSession } from '@/lib/storage'

// 每種爻型對應的三枚硬幣正反面（true=陽/正面, false=陰/背面）
const COIN_FACES: Record<LineType, [boolean, boolean, boolean]> = {
  oldYang:   [true,  true,  true ],  // 老陽：3 陽
  youngYin:  [true,  true,  false],  // 少陰：2 陽 1 陰
  youngYang: [true,  false, false],  // 少陽：1 陽 2 陰
  oldYin:    [false, false, false],  // 老陰：3 陰
}

const YAO_LABELS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

// ── 單枚硬幣元件 ────────────────────────────────────────────────
function Coin({ isYang, flipped }: { isYang: boolean; flipped: boolean }) {
  return (
    <div className="coin-wrap">
      <div className={`coin-inner ${flipped ? 'flipped' : ''}`}>
        {/* 背面（翻轉前） */}
        <div className="coin-side coin-back">
          <span className="text-inkDark/30 font-bold text-lg select-none">？</span>
        </div>
        {/* 正面（翻轉後） */}
        <div className={`coin-side ${isYang ? 'coin-yang' : 'coin-yin'}`}>
          <span className={`font-bold text-sm select-none
                            ${isYang ? 'text-vermilion' : 'text-paper'}`}>
            {isYang ? '陽' : '陰'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── 主體元件 ────────────────────────────────────────────────────
function CastContent() {
  const searchParams = useSearchParams()
  const question     = searchParams.get('q') ?? ''
  const router       = useRouter()

  const [lines,       setLines]       = useState<CastLine[]>([])
  const [doneIdx,     setDoneIdx]     = useState<number[]>([])  // 已完成的爻 index
  const [activeLine,  setActiveLine]  = useState(-1)            // 正在動畫的爻 (-1=等待)
  const [coinFlipped, setCoinFlipped] = useState(false)
  const [showButton,  setShowButton]  = useState(false)
  const castRef = useRef<CastResult | null>(null)

  // 初始化：起卦
  useEffect(() => {
    if (!question) { router.replace('/'); return }
    const result = castHexagram()
    castRef.current = result
    setLines(result.lines)
    setActiveLine(0)
  }, [question, router])

  // 每次 activeLine 變化時，跑一輪動畫
  useEffect(() => {
    if (activeLine < 0 || activeLine > 5 || lines.length === 0) return

    setCoinFlipped(false)

    // 300ms 後硬幣翻面
    const t1 = setTimeout(() => setCoinFlipped(true), 300)
    // 翻面 520ms 後（300+520+130）爻線出現
    const t2 = setTimeout(() => setDoneIdx(prev => [...prev, activeLine]), 950)
    // 再 300ms 後進入下一爻
    const t3 = setTimeout(() => {
      if (activeLine < 5) {
        setActiveLine(activeLine + 1)
      } else {
        setActiveLine(6) // 全部完成
        setTimeout(() => setShowButton(true), 400)
      }
    }, 1250)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [activeLine, lines.length])

  const handleViewResult = () => {
    const result = castRef.current
    if (!result) return
    saveCastSession({
      question,
      castLines:         result.lines,
      mainLines:         result.mainLines,
      changedLines:      result.changedLines,
      changingPositions: result.changingPositions,
      hasChanges:        result.hasChanges,
    })
    router.push('/result')
  }

  const activeData = (activeLine >= 0 && activeLine < 6 && lines[activeLine])
    ? lines[activeLine]
    : null

  return (
    <div className="flex flex-col min-h-screen px-6 py-10 bg-paper">

      {/* 問題 */}
      <div className="mb-8">
        <p className="text-inkDark/60 text-base mb-1">所問之事</p>
        <p className="text-ink text-xl font-medium leading-relaxed line-clamp-3">
          {question}
        </p>
      </div>

      {/* 狀態文字 */}
      <p className="text-center text-inkDark/50 text-base mb-6">
        {activeLine < 6
          ? `起卦中… 第 ${activeLine + 1} / 6 爻`
          : '卦象已成'}
      </p>

      {/* 爻線 + 當前硬幣動畫 */}
      <div className="flex-1 flex flex-col justify-center gap-4 max-w-xs mx-auto w-full">

        {/* 已完成的爻線 */}
        {doneIdx.map(i => (
          <div key={i} className="flex items-center gap-4 animate-fadeIn">
            <span className="text-inkDark/60 text-base w-8 text-right flex-shrink-0">
              {YAO_LABELS[i]}
            </span>
            <div className="flex-1 flex items-center">
              {lines[i].mainValue === 1 ? (
                <div className={`w-full h-2.5 rounded-full
                  ${lines[i].isChanging ? 'bg-vermilion' : 'bg-inkDark'}`} />
              ) : (
                <div className="w-full flex gap-4">
                  <div className={`flex-1 h-2.5 rounded-full
                    ${lines[i].isChanging ? 'bg-vermilion' : 'bg-inkDark'}`} />
                  <div className={`flex-1 h-2.5 rounded-full
                    ${lines[i].isChanging ? 'bg-vermilion' : 'bg-inkDark'}`} />
                </div>
              )}
            </div>
            <span className={`text-base w-14 text-right flex-shrink-0
              ${lines[i].isChanging ? 'text-vermilion font-bold' : 'text-inkDark/60'}`}>
              {lines[i].label}
            </span>
          </div>
        ))}

        {/* 當前硬幣動畫區 */}
        {activeData && (
          <div className="flex flex-col items-center gap-3 pt-2 animate-fadeIn">
            <span className="text-inkDark/50 text-base">{YAO_LABELS[activeLine]}</span>
            <div className="flex gap-4 justify-center">
              {COIN_FACES[activeData.type].map((isYang, ci) => (
                <Coin key={ci} isYang={isYang} flipped={coinFlipped} />
              ))}
            </div>
            {/* 翻面後才顯示爻名稱 */}
            {coinFlipped && (
              <span className={`text-base animate-fadeIn
                ${activeData.isChanging ? 'text-vermilion font-bold' : 'text-inkDark/60'}`}>
                {activeData.label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 查看卦象按鈕 */}
      {showButton && (
        <div className="mt-10 animate-fadeIn">
          <button
            onClick={handleViewResult}
            className="w-full py-5 rounded-xl text-2xl font-bold text-white
                       bg-ink active:scale-[0.98] transition-transform"
          >
            查看卦象
          </button>
        </div>
      )}
    </div>
  )
}

export default function CastPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-paper">
        <p className="text-inkDark/50 text-lg">載入中…</p>
      </div>
    }>
      <CastContent />
    </Suspense>
  )
}
