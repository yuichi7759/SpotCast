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

// 逆ジオコーディング（OpenStreetMap Nominatim）で地名取得
async function getCityName(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ja`,
      { headers: { 'User-Agent': 'agri-chat/1.0' }, cache: 'no-store' }
    )
    if (!res.ok) throw new Error()
    const data = await res.json()
    const a = data.address ?? {}
    return a.city ?? a.town ?? a.village ?? a.county ?? a.state ?? `${lat.toFixed(2)}, ${lng.toFixed(2)}`
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '35.6762')
  const lng = parseFloat(searchParams.get('lng') ?? '139.6503')

  try {
    // Open-Meteo: 完全無料・APIキー不要
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=Asia%2FTokyo&forecast_days=8`

    // タイムアウト付きfetch（5秒）＋ 502等の場合は1回リトライ
    async function fetchWithRetry(u: string, attempt = 0): Promise<Response> {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      try {
        const res = await fetch(u, { cache: 'no-store', signal: controller.signal })
        clearTimeout(timer)
        if (!res.ok && attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 429)) {
          await new Promise(r => setTimeout(r, 800))   // 0.8秒待ってリトライ
          return fetchWithRetry(u, 1)
        }
        return res
      } catch (e) {
        clearTimeout(timer)
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 800))
          return fetchWithRetry(u, 1)
        }
        throw e
      }
    }

    const [weatherRes, city] = await Promise.all([
      fetchWithRetry(url),
      getCityName(lat, lng),
    ])

    if (!weatherRes.ok) throw new Error(`Open-Meteo error: ${weatherRes.status}`)
    const d = await weatherRes.json()

    const cur = d.current
    const daily = d.daily

    // daily[0] = 今日、[1]〜[5] = 翌日〜5日後
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

    const result: WeatherData = {
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

    return NextResponse.json(result)
  } catch (err) {
    console.error('[weather]', err)
    // フォールバック: ダミーデータ
    const d = (n: number) => new Date(Date.now() + 86400000 * n).toISOString().slice(0, 10)
    return NextResponse.json({
      city: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      current: { temp: 22, feels_like: 21, humidity: 65, wind_speed: 2.5, weather_main: 'Clouds', weather_icon: '' },
      forecast: [
        { date: d(1), temp_max: 24, temp_min: 16, rain_prob: 10, weather_main: 'Clear' },
        { date: d(2), temp_max: 20, temp_min: 14, rain_prob: 40, weather_main: 'Rain' },
        { date: d(3), temp_max: 18, temp_min: 12, rain_prob: 20, weather_main: 'Clouds' },
        { date: d(4), temp_max: 23, temp_min: 15, rain_prob:  5, weather_main: 'Clear' },
        { date: d(5), temp_max: 25, temp_min: 17, rain_prob: 15, weather_main: 'Clear' },
      ],
    } satisfies WeatherData)
  }
}
