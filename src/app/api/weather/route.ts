import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export interface WeatherCurrent {
  temp: number
  feels_like: number
  humidity: number
  wind_speed: number
  weather_main: string
  weather_icon: string
}

export interface WeatherForecastDay {
  date: string
  temp_max: number
  temp_min: number
  rain_prob: number
  weather_main: string
}

export interface WeatherData {
  city: string
  current: WeatherCurrent
  forecast: WeatherForecastDay[]
}

// WMO weather code → OpenWeatherMap互換のmain文字列に変換
function wmoToMain(code: number): string {
  if (code === 0)               return 'Clear'
  if (code <= 3)                return 'Clouds'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 55) return 'Drizzle'
  if (code >= 56 && code <= 57) return 'Drizzle'
  if (code >= 61 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain'
  if (code === 85 || code === 86) return 'Snow'
  if (code >= 95)               return 'Thunderstorm'
  return 'Clouds'
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// Open-Meteo 取得（429/5xx は指数バックオフでリトライ、各試行10秒）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchOpenMeteo(url: string): Promise<any> {
  let lastErr: unknown = new Error('unknown')
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)
    try {
      const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
      clearTimeout(timer)
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`Open-Meteo ${res.status}`)
        await sleep(500 + attempt * 800)
        continue
      }
      if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
      return await res.json()
    } catch (e) {
      clearTimeout(timer)
      lastErr = e
      await sleep(500 + attempt * 800)
    }
  }
  throw lastErr
}

// ── インメモリキャッシュ＋同時リクエスト集約 ──
const CACHE_TTL = 10 * 60 * 1000
const cache    = new Map<string, { data: WeatherData; ts: number }>()
const inflight = new Map<string, Promise<WeatherData>>()

async function buildWeather(lat: number, lng: number): Promise<WeatherData> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=auto&forecast_days=8`   // 各地点の現地時間（日付）で返す

  // 逆ジオコーディング(Nominatim)は遅く・レート制限が厳しいため critical path から除外。
  // city は UI 未使用なので空文字でOK（フリーズ防止）。
  const d = await fetchOpenMeteo(url)
  const city = ''

  const cur = d.current
  const daily = d.daily

  const forecast: WeatherForecastDay[] = []
  for (let i = 1; i < (daily.time?.length ?? 0) && forecast.length < 7; i++) {
    forecast.push({
      date:         daily.time[i],
      temp_max:     Math.round(daily.temperature_2m_max[i] ?? 0),
      temp_min:     Math.round(daily.temperature_2m_min[i] ?? 0),
      rain_prob:    daily.precipitation_probability_max[i] ?? 0,
      weather_main: wmoToMain(daily.weather_code[i] ?? 0),
    })
  }

  return {
    city,
    current: {
      temp:         Math.round(cur.temperature_2m ?? 0),
      feels_like:   Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 0),
      humidity:     cur.relative_humidity_2m ?? 0,
      wind_speed:   Math.round((cur.wind_speed_10m ?? 0) * 10) / 10,
      weather_main: wmoToMain(cur.weather_code ?? 0),
      weather_icon: '',
    },
    forecast,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '35.6762')
  const lng = parseFloat(searchParams.get('lng') ?? '139.6503')

  // 地点ごとに一意なキー（≒11m精度。近接点が混ざらない）。同一点は共有。
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`

  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return NextResponse.json(hit.data)
  }

  let p = inflight.get(key)
  if (!p) {
    p = buildWeather(lat, lng)
      .then(r => { cache.set(key, { data: r, ts: Date.now() }); return r })
      .finally(() => inflight.delete(key))
    inflight.set(key, p)
  }

  try {
    return NextResponse.json(await p)
  } catch (err) {
    console.error('[weather]', err)
    if (hit) return NextResponse.json(hit.data)   // 古いキャッシュで代替
    // ダミーは返さない（全点同一の誤データを避ける）
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 })
  }
}
