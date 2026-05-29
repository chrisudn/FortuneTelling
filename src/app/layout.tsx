import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '卦語',
  description: '隨時問、隨時記、AI 陪你解讀易經卦象',
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
        <main className="max-w-md mx-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
