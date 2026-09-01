import type { Metadata, Viewport } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import './globals.css'

const siteUrl = 'https://www.hobbygo.com.tw'
const gaId = process.env.NEXT_PUBLIC_GA_ID

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '卦語',
  alternateName: 'Guà Yǔ',
  url: siteUrl,
  description: '隨時問、隨時記、AI 陪你解讀易經卦象。手機起卦、卦辭爻辭查詢、占卜日記，讓易經智慧融入日常提問。',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Any',
  inLanguage: 'zh-TW',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '卦語 — AI 易經占卜、隨時起卦記錄',
    template: '%s ｜ 卦語',
  },
  description: '隨時問、隨時記、AI 陪你解讀易經卦象。手機起卦、卦辭爻辭查詢、占卜日記，讓易經智慧融入日常提問。',
  keywords: ['易經', '占卜', '起卦', 'AI 解卦', '卦象', '卦辭', '爻辭', '易經占卜', '線上占卜'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: siteUrl,
    siteName: '卦語',
    title: '卦語 — AI 易經占卜、隨時起卦記錄',
    description: '隨時問、隨時記、AI 陪你解讀易經卦象。',
  },
  twitter: {
    card: 'summary_large_image',
    title: '卦語 — AI 易經占卜、隨時起卦記錄',
    description: '隨時問、隨時記、AI 陪你解讀易經卦象。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-paper font-serif">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <main className="max-w-md mx-auto min-h-screen">
          {children}
        </main>
      </body>
      {process.env.NODE_ENV === 'production' && gaId && <GoogleAnalytics gaId={gaId} />}
    </html>
  )
}
