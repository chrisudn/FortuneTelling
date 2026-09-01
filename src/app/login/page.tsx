import type { Metadata } from 'next'
import LoginClient from './LoginClient'

export const metadata: Metadata = {
  title: '登入',
  description: '登入卦語，將占卜紀錄同步到雲端，跨裝置查看你的易經占卜日記與 AI 解讀歷史。',
  alternates: { canonical: '/login' },
}

export default function LoginPage() {
  return <LoginClient />
}
