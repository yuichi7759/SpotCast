import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export interface HourlyPoint {
  time: string       // "06:00" 形式
  temp: number
  rain_prob: number  // 降水確率(%)
  precip: number     // 降水量(mm)
  wind_speed: number
  wind_dir: number
  weather_code: number
  humidity: number
}

export interface DayForecast {
  date: string       // "2026-05-28"
  temp_max: number
  temp_min: number
  rain_prob: number
  weather_code: number
  score: number      // 0-100
  wind_speed_max: number
}

export interface HourlyWeather {
  city: string
  hourly: HourlyPoint[]   // 次の48時間
  daily14: DayForecast[]  // 14日分
}

// WMO weather code → OpenWeatherMap互換のmain文字列に変換
function wmoToMain(code: number): string {
  if (code === 0)                 return 'Clear'
  if (code <= 3)                  return 'Clouds'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 55)   return 'Drizzle'
  if (code >= 56 && code <= 57)   return 'Drizzle'
  if (code >= 61 && code <= 67)   return 'Rain'
  if (code >= 71 && code <= 77)   return 'Snow'
  if (code >= 80 && code <= 82)   return 'Rain'
  if (code === 85 || code === 86) return 'Snow'
  if (code >= 95)                 return 'Thunderstorm'
  return 'Clouds'
}

// スコア計算
function calcScore(weatherCode: number, rainProb: number, tempMax: number, tempMin: number): number {
  let s = 50
  const main = wmoToMain(weatherCode)
  if (main === 'Clear') s += 30
  else if (main === 'Clouds') s += 10
  else if (main === 'Rain' || main === 'Drizzle') s -= 30
  else if (main === 'Thunderstorm') s -= 50
  if (rainProb < 10) s += 20
  else if (rainProb < 30) s += 10
  else if (rainProb > 60) s -= 20
  else if (rainProb > 80) s -= 30
  const avg = (tempMax + tempMin) / 2
  if (avg >= 15 && avg <= 25) s += 15
  else if (avg < 5 || avg > 33) s -= 20
  return Math.max(0, Math.min(100, s))
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// 逆ジオコーディング（OpenStreetMap Nominatim）で地名取得（タイムアウト付き・失敗時は座標）
async function getCityName(lat: number, lng: number): Promise<string> {
  const fallback = `${lat.toFixed(2)}, ${lng.toFixed(2)}`
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ja`,
      { headers: { 'User-Agent': 'spotcast/1.0' }, cache: 'no-store', signal: controller.signal }
    )
    clearTimeout(timer)
    if (!res.ok) throw new Error()
    const data = await res.json()
    const a = data.address ?? {}
    return a.city ?? a.town ?? a.village ?? a.county ?? a.state ?? fallback
  } catch {
    return fallback
  }
}

// Open-Meteo 取得（429/5xx は指数バックオフでリトライ、各試行10秒でタイムアウト）
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
const CACHE_TTL = 10 * 60 * 1000   // 10分
const cache    = new Map<string, { data: HourlyWeather; ts: number }>()
const inflight = new Map<string, Promise<HourlyWeather>>()

async function buildForecast(lat: number, lng: number): Promise<HourlyWeather> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m,weather_code,relative_humidity_2m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_probability_mean,wind_speed_10m_max` +
    `&timezone=Asia%2FTokyo&forecast_days=14`
    // 注: models=jma_seamless（気象庁）は降水確率を一切提供しない(null)ため指定しない。

    const [d, city] = await Promise.all([
      fetchOpenMeteo(url),
      getCityName(lat, lng),
    ])

    // hourly: その地点の現在時刻（含む現在の1時間）から48時間分をフィルタ。
    // Open-Meteo の time 文字列は地点ローカルの壁時計（オフセット無し）なので、
    // サーバーのTZに依存しないよう utc_offset_seconds を使って同じ基準で比較する。
    const offsetMs = (d.utc_offset_seconds ?? 0) * 1000
    const nowWall  = Date.now() + offsetMs          // 地点ローカルの現在(UTC枠で表現)
    const hourlyTimes: string[] = d.hourly?.time ?? []
    const temps: number[] = d.hourly?.temperature_2m ?? []
    const rainProbs: number[] = d.hourly?.precipitation_probability ?? []
    const precips: number[] = d.hourly?.precipitation ?? []
    const windSpeeds: number[] = d.hourly?.wind_speed_10m ?? []
    const windDirs: number[] = d.hourly?.wind_direction_10m ?? []
    const weatherCodes: number[] = d.hourly?.weather_code ?? []
    const humidities: number[] = d.hourly?.relative_humidity_2m ?? []

    const hourly: HourlyPoint[] = []
    for (let i = 0; i < hourlyTimes.length && hourly.length < 48; i++) {
      // 壁時計文字列を UTC として解釈 → nowWall と同じ枠で比較
      const t = new Date(hourlyTimes[i] + 'Z').getTime()
      if (t <= nowWall - 3600_000) continue   // その時間が完全に過ぎたものだけ除外（現在の1時間は残す）
      const hhmm = hourlyTimes[i].slice(11, 16) // "HH:MM"
      hourly.push({
        time: hhmm,
        temp: Math.round(temps[i] ?? 0),
        rain_prob: rainProbs[i] ?? 0,
        precip: Math.round((precips[i] ?? 0) * 10) / 10,
        wind_speed: Math.round((windSpeeds[i] ?? 0) * 10) / 10,
        wind_dir: windDirs[i] ?? 0,
        weather_code: weatherCodes[i] ?? 0,
        humidity: humidities[i] ?? 0,
      })
    }

    // daily14
    const dailyTimes: string[] = d.daily?.time ?? []
    const dailyMaxTemps: number[] = d.daily?.temperature_2m_max ?? []
    const dailyMinTemps: number[] = d.daily?.temperature_2m_min ?? []
    const dailyRainProbs: number[] = d.daily?.precipitation_probability_mean ?? []
    const dailyWeatherCodes: number[] = d.daily?.weather_code ?? []
    const dailyWindMax: number[] = d.daily?.wind_speed_10m_max ?? []

    const daily14: DayForecast[] = dailyTimes.map((date, i) => {
      const tempMax = Math.round(dailyMaxTemps[i] ?? 0)
      const tempMin = Math.round(dailyMinTemps[i] ?? 0)
      const rainProb = dailyRainProbs[i] ?? 0
      const weatherCode = dailyWeatherCodes[i] ?? 0
      return {
        date,
        temp_max: tempMax,
        temp_min: tempMin,
        rain_prob: rainProb,
        weather_code: weatherCode,
        score: calcScore(weatherCode, rainProb, tempMax, tempMin),
        wind_speed_max: Math.round((dailyWindMax[i] ?? 0) * 10) / 10,
      }
    })

    return { city, hourly, daily14 }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '35.6762')
  const lng = parseFloat(searchParams.get('lng') ?? '139.6503')

  // 0.01度（≒1km）に丸めてキャッシュキーに（BestDayと詳細で同一地点を共有）
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`

  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return NextResponse.json(hit.data)
  }

  let p = inflight.get(key)
  if (!p) {
    p = buildForecast(lat, lng)
      .then(r => { cache.set(key, { data: r, ts: Date.now() }); return r })
      .finally(() => inflight.delete(key))
    inflight.set(key, p)
  }

  try {
    return NextResponse.json(await p)
  } catch (err) {
    console.error('[weather/hourly]', err)
    // 取得失敗時は古いキャッシュがあればそれを返す（エラーよりマシ）
    if (hit) return NextResponse.json(hit.data)
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 })
  }
}
