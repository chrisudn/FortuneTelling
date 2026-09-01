import type { Metadata } from 'next'
import ResultPageClient from './ResultPageClient'

export const metadata: Metadata = {
  title: '卦象解讀',
  description: '查看本次占卜的本卦、之卦、動爻卦辭，並與 AI 深入對話解讀卦象含義。',
  robots: { index: false, follow: false },
}

export default function ResultPage() {
  return <ResultPageClient />
}
