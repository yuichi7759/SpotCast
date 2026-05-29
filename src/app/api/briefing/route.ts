import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface Field {
  id: string
  name: string
  crop?: string | null
  variety?: string | null
  planted_at?: string | null
  area_m2?: number | null
  notes?: string | null
}

interface WeatherCurrent {
  temp: number
  feels_like: number
  humidity: number
  wind_speed: number
  weather_main: string
}

interface WeatherForecastDay {
  date: string
  temp_max: number
  temp_min: number
  rain_prob: number
  weather_main: string
}

interface WeatherData {
  city: string
  current: WeatherCurrent
  forecast: WeatherForecastDay[]
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { lat, lng, region, fields, weather, force } = body as {
    lat: number
    lng: number
    region: string
    fields: Field[]
    weather: WeatherData | null
    force?: boolean
  }

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo',
  })
  const todayKey = new Date().toISOString().slice(0, 10)

  // Cache: check if we already generated today
  if (!force) {
    const { data: cached } = await supabase
      .from('field_records')
      .select('content')
      .eq('user_id', user.id)
      .eq('type', 'note')
      .like('content', `[BRIEFING:${todayKey}]%`)
      .limit(1)
      .single()

    if (cached) {
      const briefing = cached.content.replace(`[BRIEFING:${todayKey}]`, '').trim()
      return NextResponse.json({ briefing, cached: true })
    }
  }

  const fieldsSummary = fields.length === 0
    ? '登録ポイントなし'
    : fields.map(f =>
        `- ${f.name}${f.crop ? `: ${f.crop}` : ''}`
      ).join('\n')

  const weatherSummary = weather
    ? `現在: ${weather.current.temp}℃、${weather.current.weather_main}、湿度${weather.current.humidity}%、風速${weather.current.wind_speed}m/s\n` +
      weather.forecast.map(d => `${d.date}: 最高${d.temp_max}℃/最低${d.temp_min}℃、降水確率${d.rain_prob}%`).join('\n')
    : '天気データなし'

  const systemPrompt = `あなたはSpotCast AI、気になる場所の天気をサポートするアシスタントです。毎朝、登録ポイントの天気ブリーフィングを提供します。
今日の日付: ${today}
地域: ${region || `緯度${lat}, 経度${lng}`}

以下の形式でブリーフィングを作成してください：
## 🌅 今日の天気ブリーフィング

### 🌤️ 天気サマリー
（今日の天気の要点）

### 📍 ポイント別チェック
（各ポイントの今日の注目ポイント）

### ⚠️ 注意事項
（強雨・強風・猛暑・凍結など注意が必要な場合）

### 💡 今日のアドバイス
（天候に合わせた1つの有益な提案）

簡潔で実践的な内容にし、全体で400〜600文字程度にまとめてください。`

  const userMessage = `天気情報:\n${weatherSummary}\n\nポイント情報:\n${fieldsSummary}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const briefing = response.content.find(b => b.type === 'text')?.text ?? 'ブリーフィングを生成できませんでした。'

    // Cache in field_records
    await supabase.from('field_records').insert({
      user_id: user.id,
      field_id: null,
      type: 'note',
      content: `[BRIEFING:${todayKey}]${briefing}`,
    })

    return NextResponse.json({ briefing, cached: false })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
