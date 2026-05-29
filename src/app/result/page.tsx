'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadCastSession, type CastSession } from '@/lib/storage'
import { buildReadingResult, type ReadingResult } from '@/lib/hexagram'
import { getProfile, getDiaryEntries, saveDiaryEntry, updateDiaryEntry } from '@/lib/diary'
import { buildHexagramContext } from '@/lib/buildContext'
import HexagramDisplay from '@/components/HexagramDisplay'
import ChatSection from '@/components/ChatSection'
import NavBar from '@/components/NavBar'
import TrigramBadges from '@/components/TrigramBadges'
import Toast, { useToast } from '@/components/Toast'
import type { ChatMessage } from '@/components/ChatSection'

const YAO_NAMES = ['初', '二', '三', '四', '五', '上']

export default function ResultPage() {
  const router = useRouter()
  const [session, setSession] = useState<CastSession | null>(null)
  const [reading, setReading] = useState<ReadingResult | null>(null)
  const [showAllYaoCi, setShowAllYaoCi] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [hasProfile, setHasProfile] = useState(false)
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null)
  const [aiFirstResponse, setAiFirstResponse] = useState('')
  const [endedConversation, setEndedConversation] = useState<ChatMessage[] | null>(null)
  const [conversationSaved, setConversationSaved] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const s = loadCastSession()
    if (!s) { router.replace('/'); return }
    setSession(s)
    const r = buildReadingResult(s.mainLines, s.changedLines, s.changingPositions)
    if (!r) { router.replace('/'); return }
    setReading(r)
    setHasProfile(!!getProfile())
  }, [router])

  const hexagramContext = useMemo(() => {
    if (!session || !reading) return ''
    const recentEntries = hasProfile ? getDiaryEntries().slice(0, 3) : undefined
    return buildHexagramContext(session, reading, recentEntries)
  }, [session, reading, hasProfile])

  const handleSaveConversation = () => {
    if (!endedConversation || conversationSaved) return
    if (!savedEntryId) {
      toast.show('請先儲存此次占卜')
      return
    }
    updateDiaryEntry(savedEntryId, { aiConversation: endedConversation })
    setConversationSaved(true)
    toast.show('✓ 對話已儲存至日記')
  }

  const handleSave = () => {
    if (!session || !reading || savedEntryId) return
    const { mainHexagram, changedHexagram } = reading
    const entry = saveDiaryEntry({
      question: session.question,
      mainHexagramId: mainHexagram.id,
      mainHexagramName: mainHexagram.name,
      mainHexagramUnicode: mainHexagram.unicode,
      changedHexagramId: changedHexagram?.id,
      changedHexagramName: changedHexagram?.name,
      mainLines: session.mainLines,
      changedLines: session.changedLines,
      changingPositions: session.changingPositions,
      hasChanges: session.hasChanges,
      aiFirstResponse,
    })
    setSavedEntryId(entry.id)
    toast.show('✓ 已儲存至日記')
  }

  if (!session || !reading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-paper">
        <p className="text-inkDark/50 text-lg">載入中…</p>
      </div>
    )
  }

  const { mainHexagram, changedHexagram, changingYaoCi } = reading

  return (
    <div className="flex flex-col min-h-screen px-6 py-8 bg-paper pb-28">

      {/* 所問之事 */}
      <div className="mb-6 pb-5 border-b border-ink/10">
        <p className="text-inkDark/60 text-base mb-1">所問之事</p>
        <p className="text-inkDark text-lg leading-relaxed">{session.question}</p>
      </div>

      {/* 本卦卦象 */}
      <div className="text-center mb-6">
        <HexagramDisplay
          lines={session.mainLines}
          changingPositions={session.changingPositions}
          size="lg"
        />
        <div className="mt-5">
          <p className="text-inkDark/60 text-base mb-1">{mainHexagram.altName}</p>
          <h2 className="text-4xl font-bold text-ink tracking-wide mb-1">
            {mainHexagram.unicode} {mainHexagram.name}卦
          </h2>
          <p className="text-inkDark/50 text-base mb-3">{mainHexagram.keyword}</p>
          <TrigramBadges
            upper={mainHexagram.upperTrigram}
            lower={mainHexagram.lowerTrigram}
          />
        </div>
      </div>

      {/* 卦辭 */}
      <div className="bg-ink/5 rounded-2xl px-5 py-4 mb-4">
        <p className="text-ink text-sm font-bold tracking-widest mb-2">卦　辭</p>
        <p className="text-inkDark text-xl leading-relaxed">{mainHexagram.guaCi}</p>
      </div>

      {/* 大象傳 */}
      <div className="px-1 mb-5">
        <p className="text-inkDark/60 text-sm tracking-widest mb-1">大象傳</p>
        <p className="text-inkDark/70 text-base leading-relaxed">{mainHexagram.image}</p>
      </div>

      {/* 動爻 */}
      {session.hasChanges && changingYaoCi.length > 0 && (
        <div className="border-2 border-vermilion/25 rounded-2xl px-5 py-4 mb-4 bg-vermilion/5">
          <p className="text-vermilion text-sm font-bold tracking-widest mb-3">
            動　爻（{session.changingPositions.map(p => YAO_NAMES[p] + '爻').join('、')}）
          </p>
          <div className="flex flex-col gap-3">
            {changingYaoCi.map((yao, i) => (
              <div key={i}>
                <span className="text-vermilion font-bold text-base">{yao.position}　</span>
                <span className="text-inkDark text-base leading-relaxed">{yao.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 之卦 */}
      {changedHexagram && (
        <div className="bg-ink/5 rounded-2xl px-5 py-4 mb-4">
          <p className="text-ink text-sm font-bold tracking-widest mb-3">之　卦（變後走向）</p>

          {/* 卦象 + 卦名 */}
          <div className="flex items-center gap-5 mb-3">
            <HexagramDisplay lines={session.changedLines} size="sm" />
            <div>
              <p className="text-2xl font-bold text-ink">
                {changedHexagram.unicode} {changedHexagram.name}卦
              </p>
              <p className="text-inkDark/60 text-base mt-0.5">{changedHexagram.keyword}</p>
              <div className="mt-1.5">
                <TrigramBadges
                  upper={changedHexagram.upperTrigram}
                  lower={changedHexagram.lowerTrigram}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* 卦辭 */}
          <p className="text-inkDark/80 text-base leading-relaxed mb-3">
            {changedHexagram.guaCi}
          </p>

          {/* 大象傳 */}
          <div className="border-t border-ink/10 pt-3 mb-3">
            <p className="text-inkDark/40 text-sm tracking-widest mb-1">大象傳</p>
            <p className="text-inkDark/70 text-base leading-relaxed">{changedHexagram.image}</p>
          </div>

          {/* 動爻在之卦的爻辭 */}
          {session.changingPositions.length > 0 && (
            <div className="border-t border-ink/10 pt-3">
              <p className="text-vermilion text-sm font-bold tracking-widest mb-2">
                動爻在之卦（{session.changingPositions.map(p => YAO_NAMES[p] + '爻').join('、')}）
              </p>
              <div className="flex flex-col gap-2">
                {session.changingPositions.map(pos => {
                  const yao = changedHexagram.yaoCi[pos]
                  if (!yao) return null
                  return (
                    <div key={pos}>
                      <span className="text-vermilion font-bold text-base">{yao.position}　</span>
                      <span className="text-inkDark text-base leading-relaxed">{yao.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 靜卦說明 */}
      {!session.hasChanges && (
        <div className="bg-ink/5 rounded-2xl px-5 py-4 mb-4 text-center">
          <p className="text-inkDark/50 text-base">此卦為靜卦，六爻安定</p>
          <p className="text-inkDark/60 text-base mt-1">依本卦核心之道行事即可</p>
        </div>
      )}

      {/* 展開全部爻辭 */}
      <button
        onClick={() => setShowAllYaoCi(v => !v)}
        className="w-full py-4 rounded-xl text-lg font-medium text-ink
                   border-2 border-ink/15 active:bg-ink/5 transition-colors mb-4"
      >
        {showAllYaoCi ? '收起爻辭 ▲' : '展開全部爻辭 ▼'}
      </button>

      {showAllYaoCi && (
        <div className="rounded-2xl overflow-hidden border border-ink/10 mb-4">
          {mainHexagram.yaoCi.map((yao, i) => (
            <div
              key={i}
              className={`px-5 py-4 border-b border-ink/8 last:border-0 ${
                session.changingPositions.includes(i) ? 'bg-vermilion/5' : 'bg-white/50'
              }`}
            >
              <span className={`font-bold text-base ${
                session.changingPositions.includes(i) ? 'text-vermilion' : 'text-ink'
              }`}>{yao.position}　</span>
              <span className="text-inkDark text-base leading-relaxed">{yao.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* AI 解讀 */}
      {!showChat ? (
        <button
          onClick={() => setShowChat(true)}
          className="w-full py-5 rounded-xl text-xl font-bold text-white
                     bg-vermilion active:scale-[0.98] transition-transform mb-4"
        >
          詢問 AI 解讀
        </button>
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-px bg-ink/10" />
            <p className="text-inkDark/40 text-sm px-2">
              AI 解讀對話（{hasProfile ? '10' : '3'} 輪）
            </p>
            <div className="flex-1 h-px bg-ink/10" />
          </div>
          <ChatSection
            hexagramContext={hexagramContext}
            maxRounds={hasProfile ? 10 : 3}
            onFirstResponse={setAiFirstResponse}
            onConversationEnd={setEndedConversation}
          />

          {/* 對話結束後：手動儲存對話按鈕 */}
          {endedConversation && !conversationSaved && (
            <button
              onClick={handleSaveConversation}
              className="w-full py-4 rounded-xl text-base font-medium text-ink
                         border-2 border-ink/20 active:bg-ink/5 transition-colors mt-2"
            >
              儲存對話至日記
            </button>
          )}
          {conversationSaved && (
            <p className="text-center text-inkDark/40 text-sm mt-2">✓ 對話已儲存</p>
          )}
        </div>
      )}

      {/* 儲存按鈕（暱稱用戶） */}
      {hasProfile && (
        <button
          onClick={handleSave}
          disabled={!!savedEntryId}
          className={`w-full py-5 rounded-xl text-xl font-bold mb-4
                      transition-all active:scale-[0.98]
                      ${savedEntryId
                        ? 'bg-ink/10 text-inkDark/40 cursor-not-allowed'
                        : 'bg-ink text-white'
                      }`}
        >
          {savedEntryId ? '✓ 已儲存至日記' : '儲存此次占卜'}
        </button>
      )}

      {/* 未登入時引導 */}
      {!hasProfile && (
        <button
          onClick={() => router.push('/profile')}
          className="w-full py-4 rounded-xl text-base text-inkDark/50
                     border border-ink/10 mb-4"
        >
          建立暱稱以儲存占卜紀錄 →
        </button>
      )}

      {/* 重新起卦 */}
      <button
        onClick={() => router.push('/')}
        className="w-full py-4 text-lg text-inkDark/40 text-center mb-2"
      >
        ← 重新起卦
      </button>

      <NavBar />
      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}
