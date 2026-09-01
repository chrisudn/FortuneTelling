import type { Metadata } from 'next'
import HistoryPageClient from './HistoryPageClient'

export const metadata: Metadata = {
  title: '占卜日記',
  description: '回顧你過去的占卜紀錄與心情日記，以月曆或列表檢視每一次提問與卦象。',
  robots: { index: false, follow: false },
}

export default function HistoryPage() {
  return <HistoryPageClient />
}
