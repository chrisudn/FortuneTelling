import type { Metadata } from 'next'
import HomeClient from './HomeClient'

export const metadata: Metadata = {
  title: '卦語 — AI 易經占卜、隨時起卦記錄',
  description: '隨時問、隨時記、AI 陪你解讀易經卦象。手機起卦、卦辭爻辭查詢、占卜日記，讓易經智慧融入日常提問。',
  alternates: { canonical: '/' },
}

export default function HomePage() {
  return <HomeClient />
}
