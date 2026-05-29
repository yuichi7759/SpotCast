import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function fetchWeather(lat: number, lng: number) {
  const key = process.env.OPENWEATHER_API_KEY
  if (!key) return null
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${key}&units=metric&lang=ja&cnt=8`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { convId } = await req.json().catch(() => ({}))

  // Fetch user's fields
  const { data: fields } = await supabase
    .from('fields')
    .select('name, crop, variety, planted_at, lat, lng, notes')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const hasFields = fields && fields.length > 0

  // Fetch weather for first geo-tagged field
  let weatherSummary = ''
  const geoField = fields?.find(f => f.lat && f.lng)
  if (geoField) {
    const w = await fetchWeather(geoField.lat, geoField.lng)
    if (w?.list?.[0]) {
      const cur = w.list[0]
      const rain6h = cur.rain?.['3h'] ?? 0
      const wind = cur.wind?.speed ?? 0
      const temp = Math.round(cur.main?.temp ?? 0)
      const desc = cur.weather?.[0]?.description ?? ''
      const rainProb = Math.round((cur.pop ?? 0) * 100)
      weatherSummary = `気温${temp}°C、${desc}、風速${wind}m/s、降水確率${rainProb}%（6時間雨量${rain6h}mm）`
    }
  }

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Tokyo',
  })

  // Build context for the AI
  let context = `【日付】${today}\n`

  if (weatherSummary) {
    context += `【天気】${weatherSummary}\n`
  }

  if (hasFields) {
    const fieldLines = fields!.map(f => {
      return `・${f.name}${f.crop ? `（${f.crop}）` : ''}`
    })
    context += `【登録ポイント】\n${fieldLines.join('\n')}\n`
  }

  // The prompt that drives the OS behavior
  const osPrompt = hasFields
    ? `${context}
SpotCast AIとして、今日の朝の天気ブリーフィングを行ってください。

以下の構成で、簡潔かつ具体的に：
1. 今日の全体的な天気サマリー（2文以内）
2. 登録ポイントごとの注目ポイント（最大4項目）
   - ポイント名を明示し、「○○は今日降水確率60%、外出には傘必須」のように具体的に
   - 強風・大雨・猛暑など注意が必要な場所は最優先で警告する
3. 最後に一つだけ「気になるポイントはありますか？」と聞く

文体：プロフェッショナルで親しみやすく。箇条書きを活用。長すぎない。`
    : `${context}
SpotCast AIとして初回起動のブリーフィングを行ってください。

・2〜3文で自分を紹介する（気になる場所の天気をサポートするアシスタントであることを伝える）
・ポイントが未登録であることを確認する
・「まず、どこの天気が気になりますか？」と一つだけ聞く

フォームのように何項目も聞かないこと。一問一答で自然に会話を進める。`

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  ;(async () => {
    try {
      let accumulated = ''
      const streamResp = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: `あなたはSpotCast AI、気になる場所の天気をサポートするアシスタントです。
常に次のアクションを提示し、一度に聞くのは一つだけ。受け身の回答は禁止。`,
        messages: [{ role: 'user', content: osPrompt }],
        stream: true,
      })

      for await (const event of streamResp) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          accumulated += event.delta.text
          await writer.write(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
        }
      }

      // Save assistant message to conversation
      if (convId && accumulated) {
        await supabase.from('messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: accumulated,
        })
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId)
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
