import type { Metadata } from 'next'
import ProfileClient from './ProfileClient'

export const metadata: Metadata = {
  title: '我的',
  description: '設定暱稱、管理登入帳號，查看你的占卜紀錄統計。',
  robots: { index: false, follow: false },
}

export default function ProfilePage() {
  return <ProfileClient />
}
