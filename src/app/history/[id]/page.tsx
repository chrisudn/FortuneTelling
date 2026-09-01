import type { Metadata } from 'next'
import DiaryDetailPageClient from './DiaryDetailPageClient'

export const metadata: Metadata = {
  title: '日記詳情',
  description: '查看單筆占卜紀錄的完整卦象、AI 解讀對話與你寫下的心情筆記。',
  robots: { index: false, follow: false },
}

export default function DiaryDetailPage() {
  return <DiaryDetailPageClient />
}
