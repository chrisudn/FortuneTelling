'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Tab = 'magic' | 'password'
type PasswordStep = 'signin' | 'signup' | 'forgot'

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return '電子郵件或密碼錯誤'
  if (msg.includes('Email not confirmed')) return '帳號尚未驗證，請至信箱確認'
  if (msg.includes('User already registered')) return '此電子郵件已註冊，請直接登入'
  if (msg.includes('Password should be at least')) return '密碼至少需要 6 個字元'
  if (msg.includes('rate limit') || msg.includes('too many')) return '發送過於頻繁，請稍後再試'
  return msg
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('magic')
  const [step, setStep] = useState<PasswordStep>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const clearError = () => setError('')

  const switchTab = (t: Tab) => {
    setTab(t)
    setStep('signin')
    setSent(false)
    clearError()
  }

  const handleMagicLink = async () => {
    setLoading(true)
    clearError()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) setError(translateError(error.message))
    else setSent(true)
  }

  const handlePassword = async () => {
    setLoading(true)
    clearError()
    if (step === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) setError(translateError(error.message))
      else router.replace('/')
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      setLoading(false)
      if (error) setError(translateError(error.message))
      else setSent(true)
    }
  }

  const handleForgot = async () => {
    if (!email) { setError('請先輸入電子郵件'); return }
    setLoading(true)
    clearError()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setLoading(false)
    if (error) setError(translateError(error.message))
    else setSent(true)
  }

  // ── Email sent / confirmation state ──────────────────────────────
  if (sent) {
    const message =
      tab === 'magic'
        ? '登入連結已發送，請至信箱點擊連結'
        : step === 'signup'
        ? '確認信已發送，請至信箱完成驗證後即可登入'
        : '密碼重設連結已發送，請查看信箱'

    return (
      <div className="flex flex-col min-h-screen px-6 py-16 bg-paper">
        <div className="flex flex-col items-center text-center gap-5 mt-12">
          <div className="w-20 h-20 rounded-full bg-ink/8 flex items-center justify-center">
            <span className="text-4xl">✉</span>
          </div>
          <h2 className="text-2xl font-bold text-ink">請查看信箱</h2>
          <p className="text-inkDark/70 text-lg leading-relaxed max-w-xs">{message}</p>
          <button
            onClick={() => setSent(false)}
            className="text-inkDark/50 text-base underline underline-offset-4 mt-2"
          >
            重新發送
          </button>
        </div>
        <button
          onClick={() => router.push('/')}
          className="mt-auto py-4 text-inkDark/40 text-center"
        >
          ← 繼續以訪客使用
        </button>
      </div>
    )
  }

  // ── Login form ───────────────────────────────────────────────────
  const submitDisabled = loading || !email || (tab === 'password' && step !== 'forgot' && !password)

  return (
    <div className="flex flex-col min-h-screen px-6 py-16 bg-paper">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-ink tracking-wide">卦語</h1>
        <p className="text-inkDark/50 text-base mt-2">登入以同步你的占卜日記</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-ink/5 p-1 mb-6">
        {(['magic', 'password'] as const).map(t => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`flex-1 py-3 rounded-lg text-base font-medium transition-colors ${
              tab === t ? 'bg-white text-ink shadow-sm' : 'text-inkDark/50'
            }`}
          >
            {t === 'magic' ? '電子郵件連結' : '帳號密碼'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label className="block text-ink text-base font-medium mb-2">電子郵件</label>
          <input
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border-2 border-ink/20 bg-white/60 px-4 py-4 text-lg text-inkDark focus:outline-none focus:border-ink placeholder:text-inkDark/30"
            placeholder="your@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); clearError() }}
          />
        </div>

        {/* Password (password tab, not forgot step) */}
        {tab === 'password' && step !== 'forgot' && (
          <div>
            <label className="block text-ink text-base font-medium mb-2">密碼</label>
            <input
              type="password"
              autoComplete={step === 'signup' ? 'new-password' : 'current-password'}
              className="w-full rounded-xl border-2 border-ink/20 bg-white/60 px-4 py-4 text-lg text-inkDark focus:outline-none focus:border-ink placeholder:text-inkDark/30"
              placeholder={step === 'signup' ? '至少 6 個字元' : '請輸入密碼'}
              value={password}
              onChange={e => { setPassword(e.target.value); clearError() }}
              onKeyDown={e => e.key === 'Enter' && !submitDisabled && handlePassword()}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Submit button */}
        {tab === 'magic' ? (
          <button
            onClick={handleMagicLink}
            disabled={submitDisabled}
            className="w-full py-5 rounded-xl text-xl font-bold text-white bg-vermilion disabled:opacity-40 active:scale-[0.98] transition-transform mt-2"
          >
            {loading ? '發送中…' : '發送登入連結'}
          </button>
        ) : step === 'forgot' ? (
          <>
            <button
              onClick={handleForgot}
              disabled={loading || !email}
              className="w-full py-5 rounded-xl text-xl font-bold text-white bg-vermilion disabled:opacity-40 active:scale-[0.98] transition-transform mt-2"
            >
              {loading ? '發送中…' : '發送重設連結'}
            </button>
            <button
              onClick={() => { setStep('signin'); clearError() }}
              className="text-inkDark/50 text-base text-center"
            >
              ← 返回登入
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handlePassword}
              disabled={submitDisabled}
              className="w-full py-5 rounded-xl text-xl font-bold text-white bg-vermilion disabled:opacity-40 active:scale-[0.98] transition-transform mt-2"
            >
              {loading ? '處理中…' : step === 'signin' ? '登入' : '建立帳號'}
            </button>
            {step === 'signin' && (
              <button
                onClick={() => { setStep('forgot'); clearError() }}
                className="text-inkDark/50 text-sm text-center"
              >
                忘記密碼？
              </button>
            )}
            <button
              onClick={() => { setStep(step === 'signin' ? 'signup' : 'signin'); clearError() }}
              className="text-inkDark/50 text-base text-center"
            >
              {step === 'signin' ? '還沒有帳號？立即註冊 →' : '已有帳號？立即登入 →'}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => router.push('/')}
        className="mt-auto pt-8 py-4 text-inkDark/40 text-center"
      >
        ← 繼續以訪客使用
      </button>
    </div>
  )
}
