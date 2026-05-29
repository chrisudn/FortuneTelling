'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { castHexagram, type CastLine, type CastResult, type LineType } from '@/lib/casting'
import { saveCastSession } from '@/lib/storage'

const SOUND_KEY = 'gua_yu_sound'

// 每種爻型對應的三枚硬幣正反面（true=陽/正面, false=陰/背面）
const COIN_FACES: Record<LineType, [boolean, boolean, boolean]> = {
  oldYang:   [true,  true,  true ],
  youngYin:  [true,  true,  false],
  youngYang: [true,  false, false],
  oldYin:    [false, false, false],
}

const YAO_LABELS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

// ── 硬幣敲擊音效（Web Audio API 合成） ──────────────────────────
// 每枚硬幣 = 噪音爆破（撞擊感）+ 高頻金屬共鳴（叮聲），三枚錯開 18ms
function playFlipSound() {
  try {
    const AudioCtx = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()

    const strikes = [0, 0.018, 0.036] // 三枚硬幣落地時間差

    strikes.forEach(offset => {
      const t = ctx.currentTime + offset

      // 撞擊噪音（highpass 過濾，模擬金屬碰撞的「啪」）
      const noiseLen = Math.floor(ctx.sampleRate * 0.025)
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate)
      const noiseData = noiseBuf.getChannelData(0)
      for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1

      const noiseSrc = ctx.createBufferSource()
      noiseSrc.buffer = noiseBuf

      const hipass = ctx.createBiquadFilter()
      hipass.type = 'highpass'
      hipass.frequency.value = 3500

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.55, t)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.022)

      noiseSrc.connect(hipass)
      hipass.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noiseSrc.start(t)

      // 金屬共鳴（正弦波快速衰減，模擬銅錢「叮」）
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.connect(oscGain)
      oscGain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(2000, t)
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.07)
      oscGain.gain.setValueAtTime(0, t)
      oscGain.gain.linearRampToValueAtTime(0.2, t + 0.003)
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
      osc.start(t)
      osc.stop(t + 0.08)
    })

    setTimeout(() => ctx.close(), 500)
  } catch {
    // 不支援 AudioContext 時靜默忽略
  }
}

// ── 單枚硬幣元件 ─────────────────────────────────────────────────
function Coin({ isYang, flipped }: { isYang: boolean; flipped: boolean }) {
  return (
    <div className="coin-wrap">
      <div className={`coin-inner ${flipped ? 'flipped' : ''}`}>
        <div className="coin-side coin-back">
          <span className="text-inkDark/30 font-bold text-lg select-none">？</span>
        </div>
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

// ── 主體元件 ─────────────────────────────────────────────────────
function CastContent() {
  const searchParams = useSearchParams()
  const question     = searchParams.get('q') ?? ''
  const router       = useRouter()

  const [lines,       setLines]       = useState<CastLine[]>([])
  const [doneIdx,     setDoneIdx]     = useState<number[]>([])
  const [activeLine,  setActiveLine]  = useState(-1)
  const [coinFlipped, setCoinFlipped] = useState(false)
  const [showButton,  setShowButton]  = useState(false)
  const castRef = useRef<CastResult | null>(null)

  // 靜音設定：預設靜音，從 localStorage 讀取
  const [isMuted, setIsMuted] = useState(true)
  const isMutedRef = useRef(true)

  useEffect(() => {
    const stored = localStorage.getItem(SOUND_KEY)
    const muted = stored !== 'on'
    setIsMuted(muted)
    isMutedRef.current = muted
  }, [])

  const toggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    isMutedRef.current = next
    localStorage.setItem(SOUND_KEY, next ? 'off' : 'on')
  }

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

    // 300ms 後硬幣翻面，同時播放音效
    const t1 = setTimeout(() => {
      setCoinFlipped(true)
      if (!isMutedRef.current) playFlipSound()
    }, 300)

    const t2 = setTimeout(() => setDoneIdx(prev => [...prev, activeLine]), 950)
    const t3 = setTimeout(() => {
      if (activeLine < 5) {
        setActiveLine(activeLine + 1)
      } else {
        setActiveLine(6)
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
    <div className="relative flex flex-col min-h-screen px-6 py-10 bg-paper">

      {/* 靜音切換按鈕 */}
      <button
        onClick={toggleMute}
        aria-label={isMuted ? '開啟音效' : '關閉音效'}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center
                   rounded-full text-inkDark/40 active:bg-ink/5 transition-colors text-xl"
      >
        {isMuted ? '🔕' : '🔔'}
      </button>

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
