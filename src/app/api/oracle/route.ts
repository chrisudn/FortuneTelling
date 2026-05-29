import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `你是「卦語」的易經智慧導師，通曉易經六十四卦。

你的回應原則：
- 語氣溫和睿智，用語平易近人，不說文言文
- 每次回應控制在 200 字以內
- 緊扣用戶的具體問題，不說空泛的話
- 適當引用卦辭或爻辭時，要用白話解釋
- 有動爻時，重點解讀動爻的指引意義
- 有之卦時，說明事情的走向與可能的發展
- 每次回應末尾可提出一個引導深思的問題（非強制）`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface OracleRequest {
  hexagramContext: string   // 卦象資訊（第一輪時作為 user 首句）
  messages: ChatMessage[]   // 後續對話歷史
}

export async function POST(req: NextRequest) {
  const body: OracleRequest = await req.json()
  const { hexagramContext, messages } = body

  const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'user', content: hexagramContext },
    ...messages,
  ]

  let stream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>
  try {
    stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...allMessages,
      ],
      max_tokens: 500,
      temperature: 0.8,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '服務暫時無法使用'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(text))
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
