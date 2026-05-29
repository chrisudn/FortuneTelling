'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { castHexagram, YAO_POSITION_NAMES } from '@/lib/casting'
import { saveCastSession } from '@/lib/storage'
import type { CastResult } from '@/lib/casting'

const YAO_ORDER_LABELS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

function CastContent() {
  const searchParams = useSearchParams()
  const question = searchParams.get('q') ?? ''
  const router = useRouter()

  const [visibleCount, setVisibleCount] = useState(0)
  const [showButton, setShowButton] = useState(false)
  const castRef = useRef<CastResult | null>(null)

  useEffect(() => {
    if (!question) { router.replace('/'); return }

    castRef.current = castHexagram()

    let count = 0
    const interval = setInterval(() => {
      count++
      setVisibleCount(count)
      if (count >= 6) {
        clearInterval(interval)
        setTimeout(() => setShowButton(true), 500)
      }
    }, 650)

    return () => clearInterval(interval)
  }, [question, router])

  const handleViewResult = () => {
    const result = castRef.current
    if (!result) return
    saveCastSession({
      question,
      castLines: result.lines,
      mainLines: result.mainLines,
      changedLines: result.changedLines,
      changingPositions: result.changingPositions,
      hasChanges: result.hasChanges,
    })
    router.push('/result')
  }

  const lines = castRef.current?.lines ?? []

  return (
    <div className="flex flex-col min-h-screen px-6 py-10 bg-paper">
      {/* 問題 */}
      <div className="mb-8">
        <p className="text-inkDark/60 text-base mb-1">所問之事</p>
        <p className="text-ink text-xl font-medium leading-relaxed line-clamp-3">{question}</p>
      </div>

      <p className="text-center text-inkDark/50 text-base mb-8">
        {visibleCount < 6 ? '卜卦中，請靜候…' : '卦象已成'}
      </p>

      {/* 爻逐一顯示（由下至上：初爻→上爻） */}
      <div className="flex-1 flex flex-col justify-center gap-5 max-w-xs mx-auto w-full">
        {lines.slice(0, visibleCount).map((line, i) => (
          <div
            key={i}
            className="flex items-center gap-4 animate-fadeIn"
          >
            {/* 爻位標示 */}
            <span className="text-inkDark/60 text-base w-8 text-right flex-shrink-0">
              {YAO_ORDER_LABELS[i]}
            </span>

            {/* 爻線 */}
            <div className="flex-1 flex items-center">
              {line.mainValue === 1 ? (
                <div className={`w-full h-2.5 rounded-full ${line.isChanging ? 'bg-vermilion' : 'bg-inkDark'}`} />
              ) : (
                <div className="w-full flex gap-4">
                  <div className={`flex-1 h-2.5 rounded-full ${line.isChanging ? 'bg-vermilion' : 'bg-inkDark'}`} />
                  <div className={`flex-1 h-2.5 rounded-full ${line.isChanging ? 'bg-vermilion' : 'bg-inkDark'}`} />
                </div>
              )}
            </div>

            {/* 爻類型標籤 */}
            <span className={`text-base w-14 text-right flex-shrink-0 ${
              line.isChanging ? 'text-vermilion font-bold' : 'text-inkDark/60'
            }`}>
              {line.label}
            </span>
          </div>
        ))}
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
