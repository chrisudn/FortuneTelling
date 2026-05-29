'use client'
import { useEffect, useRef, useState } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSectionProps {
  hexagramContext: string
  maxRounds?: number
  onFirstResponse?: (response: string) => void
  onConversationEnd?: (messages: ChatMessage[]) => void
}

export default function ChatSection({
  hexagramContext,
  maxRounds = 3,
  onFirstResponse,
  onConversationEnd,
}: ChatSectionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [round, setRound] = useState(0)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const firstResponseFired = useRef(false)
  const conversationEndFired = useRef(false)

  // 載入後自動觸發第一輪
  useEffect(() => { sendToAI([]) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  async function sendToAI(history: ChatMessage[]) {
    setIsLoading(true)
    setStreamText('')
    setError('')

    try {
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hexagramContext, messages: history }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || '服務暫時無法使用')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setStreamText(accumulated)
      }

      const aiMessage: ChatMessage = { role: 'assistant', content: accumulated }
      const nextMessages = [...history, aiMessage]
      setMessages(nextMessages)
      setStreamText('')
      const nextRound = round + 1
      setRound(nextRound)

      // 第一輪完成後回傳給父元件（用於儲存日記）
      if (!firstResponseFired.current && onFirstResponse) {
        firstResponseFired.current = true
        onFirstResponse(accumulated)
      }

      // 達到對話上限時，回傳完整對話（用於手動儲存）
      if (nextRound >= maxRounds && !conversationEndFired.current && onConversationEnd) {
        conversationEndFired.current = true
        onConversationEnd(nextMessages)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '發生未知錯誤，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text || isLoading || round >= maxRounds) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    const newHistory = [...messages, userMsg]
    setMessages(newHistory)
    setInput('')
    sendToAI(newHistory)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const isDone = round >= maxRounds && !isLoading

  return (
    <div className="flex flex-col gap-4">
      {/* 對話泡泡 */}
      <div className="flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed
              ${msg.role === 'user'
                ? 'bg-ink text-white rounded-br-sm'
                : 'bg-white/80 text-inkDark border border-ink/10 rounded-bl-sm'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming 中 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 text-base
                            leading-relaxed bg-white/80 text-inkDark border border-ink/10">
              {streamText || (
                <span className="flex gap-1 items-center text-inkDark/40 py-1">
                  <span className="w-2 h-2 rounded-full bg-inkDark/30 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-inkDark/30 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-inkDark/30 animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-vermilion text-sm py-2">⚠ {error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 輸入區 */}
      {!isDone ? (
        <div className="flex gap-2 items-end">
          <textarea
            className="flex-1 rounded-xl border-2 border-ink/20 bg-white/60
                       px-4 py-3 text-base text-inkDark leading-relaxed
                       focus:outline-none focus:border-ink
                       resize-none min-h-[52px] max-h-[120px]
                       placeholder:text-inkDark/30 disabled:opacity-40"
            placeholder={round === 0 ? '等候卦象解讀中…' : `追問（剩餘 ${maxRounds - round} 次）`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || round === 0}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || round === 0}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-vermilion text-white
                       flex items-center justify-center text-xl
                       disabled:opacity-40 active:scale-95 transition-transform"
          >↑</button>
        </div>
      ) : (
        <div className="text-center py-3 bg-ink/5 rounded-xl">
          <p className="text-inkDark/50 text-sm">已達對話上限（{maxRounds} 輪）</p>
        </div>
      )}

      <p className="text-center text-inkDark/30 text-xs">{round} / {maxRounds} 輪對話</p>
    </div>
  )
}
