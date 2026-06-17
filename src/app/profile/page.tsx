'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getProfile, saveProfile, getDiaryEntries } from '@/lib/diary'
import { createClient } from '@/lib/supabase/client'
import NavBar from '@/components/NavBar'
import Toast, { useToast } from '@/components/Toast'
import type { User } from '@supabase/supabase-js'

export default function ProfilePage() {
  const router = useRouter()
  // undefined = 仍在確認 auth 狀態
  const [authUser, setAuthUser] = useState<User | null | undefined>(undefined)
  const [entryCount, setEntryCount] = useState(() => getDiaryEntries().length)
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const toast = useToast()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user ?? null
      setAuthUser(user)

      if (user) {
        // 已登入 → 從 Supabase 讀取筆數
        if (!user.user_metadata?.nickname) {
          const local = getProfile()
          if (local?.nickname) setNickname(local.nickname)
        }
        try {
          const res = await fetch('/api/diary/count')
          if (res.ok) {
            const { count } = await res.json()
            setEntryCount(count)
          } else {
            setEntryCount(getDiaryEntries().length)
          }
        } catch {
          setEntryCount(getDiaryEntries().length)
        }
      } else {
        // 未登入 → 從 localStorage 讀取
        setEntryCount(getDiaryEntries().length)
      }
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setAuthUser(null)
    setEntryCount(getDiaryEntries().length)
  }

  const handleCreateNickname = async () => {
    const name = nickname.trim()
    if (!name || saving) return
    setSaving(true)
    setSaveError('')

    if (authUser) {
      const supabase = createClient()
      const { data, error } = await supabase.auth.updateUser({ data: { nickname: name } })
      if (error) {
        setSaveError('儲存失敗，請稍後再試')
        setSaving(false)
        return
      }
      if (data.user) setAuthUser(data.user)
      saveProfile(name) // 保持 localStorage 同步，供其他頁面暫時使用
      toast.show('✓ 已同步至雲端')
    } else {
      saveProfile(name)
      toast.show('✓ 暱稱已儲存')
    }

    setSaving(false)
    setNickname('')
  }

  if (authUser === undefined) return null

  // 顯示用的衍生值
  const isLoggedIn = !!authUser
  const cloudNickname = authUser?.user_metadata?.nickname as string | undefined
  const localProfile = getProfile()
  const localNickname = localProfile?.nickname
  const displayNickname = isLoggedIn ? cloudNickname : localNickname
  const hasNickname = !!displayNickname
  const joinDate = isLoggedIn
    ? new Date(authUser.created_at)
    : localProfile ? new Date(localProfile.createdAt) : new Date()

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-paper pb-28">
      <h1 className="text-3xl font-bold text-ink mb-6">我的</h1>

      {/* 雲端帳號狀態 */}
      {isLoggedIn ? (
        <div className="flex items-center justify-between bg-ink/5 rounded-2xl px-5 py-4 mb-6">
          <div>
            <p className="text-ink text-sm font-bold mb-0.5">已登入</p>
            <p className="text-inkDark/60 text-sm">{authUser.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-inkDark/50 text-sm border border-ink/15 rounded-lg px-3 py-1.5 active:bg-ink/5"
          >
            登出
          </button>
        </div>
      ) : (
        <button
          onClick={() => router.push('/login')}
          className="w-full text-left bg-vermilion/5 border border-vermilion/20 rounded-2xl px-5 py-4 mb-6 active:bg-vermilion/10"
        >
          <p className="text-vermilion text-sm font-bold mb-0.5">登入以同步占卜日記</p>
          <p className="text-inkDark/50 text-sm">換裝置也能看到所有記錄 →</p>
        </button>
      )}

      {/* 暱稱區塊 */}
      {!hasNickname ? (
        <div className="flex flex-col gap-6">
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
            <label className="block text-ink text-xl font-medium mb-3">請輸入你的暱稱</label>
            <input
              type="text"
              className="w-full rounded-xl border-2 border-ink/30 bg-white/60
                         px-4 py-4 text-xl text-inkDark
                         focus:outline-none focus:border-ink
                         placeholder:text-inkDark/30"
              placeholder="例：阿明、小玉…"
              value={nickname}
              onChange={e => { setNickname(e.target.value); setSaveError('') }}
              maxLength={20}
            />
          </div>

          {saveError && (
            <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{saveError}</p>
          )}

          <button
            onClick={handleCreateNickname}
            disabled={!nickname.trim() || saving}
            className="w-full py-5 rounded-xl text-2xl font-bold text-white
                       bg-vermilion disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {saving ? '儲存中…' : '建立暱稱'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* 個人資訊 */}
          <div className="bg-ink/5 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-ink/15 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-ink">
                {displayNickname!.slice(0, 1)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-ink truncate">{displayNickname}</p>
                {isLoggedIn && (
                  <span className="text-xs text-inkDark/40 bg-ink/8 rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                    ☁ 雲端
                  </span>
                )}
              </div>
              <p className="text-inkDark/40 text-base mt-0.5">
                {joinDate.toLocaleDateString('zh-TW', {
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

      <p className="text-center text-inkDark/25 text-sm pt-8 pb-2 select-none">
        v{process.env.NEXT_PUBLIC_APP_VERSION}
      </p>

      <NavBar />
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
