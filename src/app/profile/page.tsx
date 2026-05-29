'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, saveProfile, getDiaryEntries, type UserProfile } from '@/lib/diary'
import NavBar from '@/components/NavBar'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [nickname, setNickname] = useState('')
  const [entryCount, setEntryCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setProfile(getProfile())
    setEntryCount(getDiaryEntries().length)
    setLoaded(true)
  }, [])

  const handleCreate = () => {
    const name = nickname.trim()
    if (!name) return
    setProfile(saveProfile(name))
  }

  if (!loaded) return null

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-paper pb-28">
      <h1 className="text-3xl font-bold text-ink mb-8">我的</h1>

      {!profile ? (
        <div className="flex flex-col gap-6">
          {/* 說明 */}
          <div className="bg-ink/5 rounded-2xl p-5">
            <p className="text-inkDark text-xl font-medium mb-3">建立暱稱後可以：</p>
            <ul className="text-inkDark/70 text-lg leading-loose space-y-1">
              <li>• 儲存每次的占卜紀錄</li>
              <li>• 加寫心情日記</li>
              <li>• AI 對話延長至 10 輪</li>
              <li>• AI 了解你過去的提問</li>
            </ul>
          </div>

          <div>
            <label className="block text-ink text-xl font-medium mb-3">
              請輸入你的暱稱
            </label>
            <input
              type="text"
              className="w-full rounded-xl border-2 border-ink/30 bg-white/60
                         px-4 py-4 text-xl text-inkDark
                         focus:outline-none focus:border-ink
                         placeholder:text-inkDark/30"
              placeholder="例：阿明、小玉…"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!nickname.trim()}
            className="w-full py-5 rounded-xl text-2xl font-bold text-white
                       bg-vermilion disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            建立暱稱
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* 個人資訊 */}
          <div className="bg-ink/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-ink/15 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-ink">
                {profile.nickname.slice(0, 1)}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{profile.nickname}</p>
              <p className="text-inkDark/40 text-base mt-0.5">
                {new Date(profile.createdAt).toLocaleDateString('zh-TW', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })} 加入
              </p>
            </div>
          </div>

          {/* 統計 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/60 border border-ink/8 rounded-2xl p-5 text-center">
              <p className="text-4xl font-bold text-ink">{entryCount}</p>
              <p className="text-inkDark/50 text-base mt-1">占卜紀錄</p>
            </div>
            <button
              onClick={() => router.push('/history')}
              className="bg-white/60 border border-ink/8 rounded-2xl p-5 text-center
                         active:bg-ink/5 transition-colors"
            >
              <p className="text-4xl font-bold text-ink">→</p>
              <p className="text-inkDark/50 text-base mt-1">查看歷史</p>
            </button>
          </div>

          {/* AI 說明 */}
          <div className="bg-vermilion/5 border border-vermilion/20 rounded-2xl p-4">
            <p className="text-vermilion text-sm font-bold mb-1">暱稱用戶專屬</p>
            <p className="text-inkDark/60 text-base">AI 對話 10 輪，並了解你的占卜歷史</p>
          </div>
        </div>
      )}

      <NavBar />
    </div>
  )
}
