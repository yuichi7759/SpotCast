// ───────────────────────────────────────────────────────────────────────────
// MET Norway (yr.no) フォールバック天気プロバイダ
// Open-Meteo (api.open-meteo.com) が落ちている時の予備。APIキー不要・無料・世界対応。
// 注意: MET Norway は説明的な User-Agent が必須（無いと 403）。
//       時刻はUTCで返るため、経度から概算したタイムゾーンで現地時刻に変換する
//       （Open-Meteoのtimezone=auto相当の正確さは無いが、障害時の劣化運用として許容）。
// ───────────────────────────────────────────────────────────────────────────

const UA = 'SpotCast/1.0 weather app (https://spotcast.evident-ai.org)'

// ── サーキットブレーカー ──
// Open-Meteoが落ちている間、毎回15秒待たされないように。一度失敗したら
// 一定時間は Open-Meteo をスキップして即フォールバックする（自動で復帰判定）。
let openMeteoDownUntil = 0
export function isOpenMeteoDown(): boolean { return Date.now() < openMeteoDownUntil }
export function markOpenMeteoDown(): void { openMeteoDownUntil = Date.now() + 60_000 }  // 60秒クールダウン
export function markOpenMeteoUp(): void { openMeteoDownUntil = 0 }

// WMO weather code（Open-Meteo互換）に揃える → 既存の wmoToMain / アイコン処理を再利用できる
function symbolToWmo(symbolRaw: string): number {
  const s = (symbolRaw || '').replace(/_(day|night|polartwilight)$/, '')
  if (s.includes('thunder')) return 95
  if (s.startsWith('clearsky') || s.startsWith('fair')) return 0
  if (s.startsWith('partlycloudy')) return 2
  if (s.startsWith('cloudy')) return 3
  if (s === 'fog') return 45
  if (s.includes('snow')) {
    if (s.includes('heavy')) return 75
    if (s.includes('light')) return 71
    if (s.includes('showers')) return 85
    return 73
  }
  if (s.includes('sleet')) return s.includes('heavy') ? 67 : 66
  if (s.includes('rain')) {
    if (s.includes('showers')) return s.includes('heavy') ? 82 : s.includes('light') ? 80 : 81
    if (s.includes('heavy')) return 65
    if (s.includes('light')) return 61
    return 63
  }
  return 3 // 不明は曇り扱い
}

function wmoToMain(code: number): string {
  if (code === 0)                 return 'Clear'
  if (code <= 3)                  return 'Clouds'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 57)   return 'Drizzle'
  if (code >= 61 && code <= 67)   return 'Rain'
  if (code >= 71 && code <= 77)   return 'Snow'
  if (code >= 80 && code <= 82)   return 'Rain'
  if (code === 85 || code === 86) return 'Snow'
  if (code >= 95)                 return 'Thunderstorm'
  return 'Clouds'
}

function calcScore(weatherCode: number, rainProb: number, tempMax: number, tempMin: number): number {
  let s = 50
  const main = wmoToMain(weatherCode)
  if (main === 'Clear') s += 30
  else if (main === 'Clouds') s += 10
  else if (main === 'Rain' || main === 'Drizzle') s -= 30
  else if (main === 'Thunderstorm') s -= 50
  if (rainProb < 10) s += 20
  else if (rainProb < 30) s += 10
  else if (rainProb > 80) s -= 30
  else if (rainProb > 60) s -= 20
  const avg = (tempMax + tempMin) / 2
  if (avg >= 15 && avg <= 25) s += 15
  else if (avg < 5 || avg > 33) s -= 20
  return Math.max(0, Math.min(100, s))
}

interface MetEntry {
  utcMs: number
  temp: number
  humidity: number
  windSpeed: number
  windDir: number
  wmo: number
  precip: number     // next_1_hours mm（無ければ next_6_hours から）
  rainProb: number   // probability_of_precipitation %（無ければ 0）
  hourly: boolean    // next_1_hours があるか（=1時間粒度）
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMet(lat: number, lng: number): Promise<{ entries: MetEntry[]; offsetSec: number }> {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`MET Norway ${res.status}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json()
  const ts: any[] = d?.properties?.timeseries ?? []
  if (!ts.length) throw new Error('MET Norway empty')

  // 経度からタイムゾーンを概算（15度=1時間）。障害時の劣化運用として許容。
  const offsetSec = Math.round(lng / 15) * 3600

  const entries: MetEntry[] = ts.map((e) => {
    const det = e.data?.instant?.details ?? {}
    const n1 = e.data?.next_1_hours
    const n6 = e.data?.next_6_hours
    const block = n1 ?? n6
    const sym: string = block?.summary?.symbol_code ?? ''
    return {
      utcMs: Date.parse(e.time),
      temp: det.air_temperature ?? 0,
      humidity: det.relative_humidity ?? 0,
      windSpeed: det.wind_speed ?? 0,
      windDir: det.wind_from_direction ?? 0,
      wmo: symbolToWmo(sym),
      precip: n1?.details?.precipitation_amount ?? n6?.details?.precipitation_amount ?? 0,
      rainProb: block?.details?.probability_of_precipitation ?? 0,
      hourly: !!n1,
    }
  })
  return { entries, offsetSec }
}

function localParts(utcMs: number, offsetSec: number): { date: string; hhmm: string; tempKey: string } {
  const d = new Date(utcMs + offsetSec * 1000)
  // UTCゲッターで「現地壁時計」を読む（offsetを足した値をUTCとして解釈）
  const y = d.getUTCFullYear()
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0')
  const da = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  return { date: `${y}-${mo}-${da}`, hhmm: `${hh}:${mm}`, tempKey: `${y}-${mo}-${da}` }
}

// ── /api/weather 形式（現在 + 7日） ──
export interface FbWeatherData {
  city: string
  current: { temp: number; feels_like: number; humidity: number; wind_speed: number; weather_main: string; weather_icon: string }
  forecast: Array<{ date: string; temp_max: number; temp_min: number; rain_prob: number; weather_main: string }>
}

export async function metnoWeather(lat: number, lng: number): Promise<FbWeatherData> {
  const { entries, offsetSec } = await fetchMet(lat, lng)
  const cur = entries[0]

  // 日別集計（現地日付ごと）
  const byDate = aggregateDaily(entries, offsetSec)
  const todayStr = localParts(cur.utcMs, offsetSec).date
  const forecast = byDate
    .filter((d) => d.date > todayStr)
    .slice(0, 7)
    .map((d) => ({
      date: d.date,
      temp_max: Math.round(d.tMax),
      temp_min: Math.round(d.tMin),
      rain_prob: Math.round(d.rainProb),
      weather_main: wmoToMain(d.wmo),
    }))

  return {
    city: '',
    current: {
      temp: Math.round(cur.temp),
      feels_like: Math.round(cur.temp), // METは体感温度を返さない → 気温で代替
      humidity: Math.round(cur.humidity),
      wind_speed: Math.round(cur.windSpeed * 10) / 10,
      weather_main: wmoToMain(cur.wmo),
      weather_icon: '',
    },
    forecast,
  }
}

// ── /api/weather/hourly 形式（48時間 + 14日） ──
export interface FbHourlyWeather {
  city: string
  hourly: Array<{ time: string; date: string; temp: number; rain_prob: number; precip: number; wind_speed: number; wind_dir: number; weather_code: number; humidity: number }>
  daily14: Array<{ date: string; temp_max: number; temp_min: number; rain_prob: number; weather_code: number; score: number; wind_speed_max: number }>
}

export async function metnoHourly(lat: number, lng: number): Promise<FbHourlyWeather> {
  const { entries, offsetSec } = await fetchMet(lat, lng)
  const nowMs = Date.now()

  const hourly = entries
    .filter((e) => e.hourly && e.utcMs > nowMs - 3600_000)
    .slice(0, 48)
    .map((e) => {
      const { date, hhmm } = localParts(e.utcMs, offsetSec)
      return {
        time: hhmm,
        date,
        temp: Math.round(e.temp),
        rain_prob: Math.round(e.rainProb),
        precip: Math.round(e.precip * 10) / 10,
        wind_speed: Math.round(e.windSpeed * 10) / 10,
        wind_dir: Math.round(e.windDir),
        weather_code: e.wmo,
        humidity: Math.round(e.humidity),
      }
    })

  const daily14 = aggregateDaily(entries, offsetSec)
    .slice(0, 14)
    .map((d) => {
      const tMax = Math.round(d.tMax)
      const tMin = Math.round(d.tMin)
      return {
        date: d.date,
        temp_max: tMax,
        temp_min: tMin,
        rain_prob: Math.round(d.rainProb),
        weather_code: d.wmo,
        score: calcScore(d.wmo, d.rainProb, tMax, tMin),
        wind_speed_max: Math.round(d.windMax * 10) / 10,
      }
    })

  return { city: '', hourly, daily14 }
}

interface DayAgg { date: string; tMax: number; tMin: number; rainProb: number; wmo: number; windMax: number }

function aggregateDaily(entries: MetEntry[], offsetSec: number): DayAgg[] {
  const map = new Map<string, { tMax: number; tMin: number; rainProb: number; windMax: number; noon?: number; codes: number[] }>()
  for (const e of entries) {
    const { date, hhmm } = localParts(e.utcMs, offsetSec)
    let g = map.get(date)
    if (!g) { g = { tMax: -999, tMin: 999, rainProb: 0, windMax: 0, codes: [] }; map.set(date, g) }
    g.tMax = Math.max(g.tMax, e.temp)
    g.tMin = Math.min(g.tMin, e.temp)
    g.rainProb = Math.max(g.rainProb, e.rainProb)
    g.windMax = Math.max(g.windMax, e.windSpeed)
    g.codes.push(e.wmo)
    // 正午前後を代表シンボルに
    const hh = parseInt(hhmm.slice(0, 2), 10)
    if (g.noon === undefined && hh >= 11 && hh <= 14) g.noon = e.wmo
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, g]) => ({
      date,
      tMax: g.tMax,
      tMin: g.tMin,
      rainProb: g.rainProb,
      windMax: g.windMax,
      // 代表コード: 正午があればそれ、無ければ「最も悪い天気」を採用
      wmo: g.noon ?? g.codes.reduce((a, b) => Math.max(a, b), 0),
    }))
}
