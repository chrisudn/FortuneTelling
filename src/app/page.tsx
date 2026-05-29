'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'

export default function HomePage() {
  const [question, setQuestion] = useState('')
  const router = useRouter()

  const handleCast = () => {
    const q = question.trim()
    if (!q) return
    router.push(`/cast?q=${encodeURIComponent(q)}`)
  }

  return (
    <div className="flex flex-col min-h-screen px-6 py-10 bg-paper pb-28">

      {/* 標題 */}
      <div className="text-center pt-8 mb-10">
        <h1 className="text-5xl font-bold text-ink tracking-widest mb-3">卦　語</h1>
        {/* 古典裝飾分隔 */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="flex-1 max-w-[60px] h-px bg-ink/20" />
          <span className="text-ink/40 text-lg">☯</span>
          <span className="flex-1 max-w-[60px] h-px bg-ink/20" />
        </div>
        <p className="text-inkDark/60 text-lg">隨時問，隨時記</p>
      </div>

      {/* 輸入區 */}
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <label
            htmlFor="question-input"
            className="block text-ink text-xl font-medium mb-3"
          >
            今日欲問何事？
          </label>
          <textarea
            id="question-input"
            aria-label="請輸入今日想問之事"
            className="w-full rounded-xl border-2 border-ink/30 bg-white/60
                       px-4 py-4 text-xl text-inkDark leading-relaxed
                       focus:outline-none focus:border-ink
                       min-h-[140px] resize-none placeholder:text-inkDark/30"
            placeholder="請輸入今日想問之事…"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            maxLength={200}
          />
          <p
            aria-live="polite"
            className="text-right text-base text-inkDark/50 mt-1"
          >
            {question.length} / 200
          </p>
        </div>

        <button
          onClick={handleCast}
          disabled={!question.trim()}
          aria-disabled={!question.trim()}
          className="w-full py-5 rounded-xl text-2xl font-bold text-white
                     bg-vermilion active:scale-[0.98]
                     disabled:opacity-40 disabled:cursor-not-allowed
                     transition-transform"
        >
          起　卦
        </button>
      </div>

      {/* 底部提示 */}
      <p className="text-center text-inkDark/50 text-base pb-6 pt-10">
        以三硬幣法模擬起卦
      </p>

      <NavBar />
    </div>
  )
}
