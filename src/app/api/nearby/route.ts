import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// クリック地点の「周辺の見どころ」を Wikipedia GeoSearch から取得（無料・APIキー不要）。
// 写真があるものに絞って“観光っぽさ”を出し、無ければ静かに空配列を返す（UIは非表示に）。

export interface NearbyPlace {
  title: string
  extract: string
  thumbnail: string
  dist: number      // メートル
  url: string
  lat: number
  lon: number
}

const UA = 'SpotCast/1.0 weather app (https://spotcast.evident-ai.org)'
const CACHE_TTL = 60 * 60 * 1000   // 1時間
const cache = new Map<string, { data: NearbyPlace[]; ts: number }>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function wpFetch(url: string): Promise<any> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(7000) })
  if (!res.ok) throw new Error(`Wikipedia ${res.status}`)
  return res.json()
}

async function fetchNearby(lat: number, lng: number, lang: 'ja' | 'en'): Promise<NearbyPlace[]> {
  const base = `https://${lang}.wikipedia.org/w/api.php`
  // 1. 周辺の地物（距離順）
  const geo = await wpFetch(
    `${base}?action=query&list=geosearch&gscoord=${lat}%7C${lng}&gsradius=10000&gslimit=20&format=json`
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = geo?.query?.geosearch ?? []
  if (!items.length) return []

  // 2. 各記事の要約＋サムネをまとめて取得
  const ids = items.map(i => i.pageid).join('|')
  const det = await wpFetch(
    `${base}?action=query&pageids=${ids}&prop=pageimages|extracts&exintro&explaintext&exsentences=2&piprop=thumbnail&pithumbsize=320&format=json`
  )
  const pages = det?.query?.pages ?? {}

  // 3. 写真があるものだけ＝観光スポットらしいものに絞り、距離順で上位6件
  const places: NearbyPlace[] = []
  for (const it of items) {
    const p = pages[it.pageid]
    if (!p || !p.thumbnail?.source) continue
    places.push({
      title: p.title,
      extract: (p.extract ?? '').trim(),
      thumbnail: p.thumbnail.source,
      dist: Math.round(it.dist),
      url: `https://${lang}.wikipedia.org/?curid=${it.pageid}`,
      lat: it.lat,
      lon: it.lon,
    })
    if (places.length >= 6) break
  }
  return places
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const lat = parseFloat(sp.get('lat') ?? '')
  const lng = parseFloat(sp.get('lng') ?? '')
  const lang = sp.get('lang') === 'ja' ? 'ja' : 'en'
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ places: [] })
  }

  const key = `${lang}:${lat.toFixed(3)},${lng.toFixed(3)}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return NextResponse.json({ places: hit.data })
  }

  try {
    const places = await fetchNearby(lat, lng, lang)
    cache.set(key, { data: places, ts: Date.now() })
    if (cache.size > 1000) { for (const [k, v] of cache) if (Date.now() - v.ts > CACHE_TTL) cache.delete(k) }
    return NextResponse.json({ places })
  } catch (e) {
    console.warn('[nearby]', e)
    return NextResponse.json({ places: [] })   // 失敗時は静かに空（UIは非表示）
  }
}
