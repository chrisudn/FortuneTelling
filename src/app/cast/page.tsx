import type { Metadata } from 'next'
import { Suspense } from 'react'
import CastPageClient from './CastPageClient'

export const metadata: Metadata = {
  title: '起卦中',
  description: '正在以三硬幣法為你起卦，稍候即可看到本卦、之卦與 AI 解讀。',
  robots: { index: false, follow: false },
}

export default function CastPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-paper">
        <p className="text-inkDark/50 text-lg">載入中…</p>
      </div>
    }>
      <CastPageClient />
    </Suspense>
  )
}
