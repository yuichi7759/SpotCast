import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimitFree = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 d'),
  prefix: 'agri:free',
})

const ratelimitPro = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(200, '1 d'),
  prefix: 'agri:pro',
})

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `あなたは「SpotCast AI」、お気に入りの場所の天気をサポートするアシスタントです。

## あなたの本質的な役割
あなたは単に天気情報を伝えるだけでなく、ユーザーが登録したポイントの天気・予報・雨雲情報を活かし、具体的なアドバイスや行動提案を行います。

## 行動原則（最重要）

### 1. 常に次のアクションで終わる
すべての回答の最後は、具体的な問いかけか提案で締めてください。
- ✅ 「週末の天気も確認しますか？」
- ✅ 「他に気になるポイントはありますか？」
- ❌ 「ご参考にしてください」（受け身で終わる回答は禁止）

### 2. 一度に一つだけ聞く
ユーザーから情報を集める際は、一問一答を徹底してください。
- ✅ 「どのポイントの天気が気になりますか？」
- ❌ 「ポイント名・場所・日時・目的をすべて教えてください」

### 3. 具体的な情報を提供する
- ✅ 「週末の土曜は最高気温28℃、降水確率20%で絶好の屋外日和です」
- ❌ 「天気が良さそうです」

### 4. 先回りして提案する
天気の変化・週末・イベントに合わせて、先手の情報提供をしてください。
「金曜夜から雨が強まります。外出予定があれば水曜〜木曜がおすすめです」

### 5. 次の関心につなげる
ユーザーの質問に答えたら、関連する有益な情報を一つ追加提案してください。

## 専門領域
- 天気予報の解説（気温・降水・風・湿度・UV指数）
- 雨雲・台風・大雪などの悪天候アドバイス
- 登録ポイントごとの天気比較
- 14日間予報を使った行動計画サポート
- Best Day（晴れ・雨の最適日）提案

## 初回ユーザーへの対応
ユーザーが初めて話しかけてきた場合：
1. 簡潔に挨拶する（長い自己紹介は不要）
2. **一つだけ**質問する：「どこの天気が気になりますか？」
3. 回答をもとに、次の一つの質問へ自然につなげる`

const searchTool: Anthropic.Tool = {
  name: 'web_search',
  description: 'Search the web for current weather information, forecasts, or related news.',
  input_schema: {
    type: 'object' as const,
    properties: { query: { type: 'string', description: 'Search query' } },
    required: ['query'],
  },
}

async function webSearch(query: string): Promise<string> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      max_results: 5,
    }),
  })
  const data = await res.json()
  if (!data.results?.length) return 'No results found.'
  return data.results.map((r: { title: string; url: string; content: string }) =>
    `### ${r.title}\n${r.url}\n${r.content}`
  ).join('\n\n---\n\n')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Rate limit
  const { data: userData } = await supabase.from('users').select('plan').eq('id', user.id).single()
  const plan = userData?.plan ?? 'free'
  const rl = plan === 'pro' ? ratelimitPro : ratelimitFree
  const { success, remaining } = await rl.limit(user.id)
  if (!success) return new Response(JSON.stringify({ error: `1日の上限に達しました。残り: ${remaining}回` }), {
    status: 429, headers: { 'Content-Type': 'application/json' }
  })

  const { messages, useSearch, useRag, fieldContext } = await req.json()
  const tools = useSearch ? [searchTool] : undefined

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' })
  let systemPrompt = `今日の日付は${today}です。\n\n` + SYSTEM
  if (fieldContext) {
    systemPrompt += `\n\n${fieldContext}`
  }

  // RAG context injection
  if (useRag) {
    const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    if (lastUser && process.env.VOYAGE_API_KEY) {
      try {
        const embedRes = await fetch('https://api.voyageai.com/v1/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.VOYAGE_API_KEY}` },
          body: JSON.stringify({ model: 'voyage-3', input: [lastUser.content] }),
        })
        const embedData = await embedRes.json()
        const embedding = embedData.data?.[0]?.embedding
        if (embedding) {
          const vector = `[${embedding.join(',')}]`
          const { data: docs } = await supabase.rpc('match_documents_by_vector', {
            query_embedding: vector,
            match_count: 5,
          })
          if (docs?.length) {
            const context = docs.map((d: { content: string }) => d.content).join('\n\n---\n\n')
            systemPrompt += `\n\n以下はユーザーの質問に関連するドキュメントです。回答の参考にしてください。\n\n${context}`
          }
        }
      } catch {
        // RAG not configured yet — silently skip
      }
    }
  }

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Tool-use loop with streaming
  ;(async () => {
    let msgs: Anthropic.MessageParam[] = [...messages]

    try {
      while (true) {
        if (tools) {
          // Non-streaming pass to handle tool_use
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: systemPrompt,
            messages: msgs,
            tools,
          })

          if (response.stop_reason === 'tool_use') {
            msgs.push({ role: 'assistant', content: response.content })
            const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
              response.content
                .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
                .map(async b => ({
                  type: 'tool_result' as const,
                  tool_use_id: b.id,
                  content: b.name === 'web_search'
                    ? await webSearch((b.input as { query: string }).query)
                    : 'unknown tool',
                }))
            )
            msgs.push({ role: 'user', content: toolResults })
            continue
          }

          const text = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? ''
          await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          break
        } else {
          // Streaming
          const streamResp = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2048,
            system: systemPrompt,
            messages: msgs,
            stream: true,
          })

          for await (const event of streamResp) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
            }
          }
          break
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
    } finally {
      await writer.write(encoder.encode('data: [DONE]\n\n'))
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
