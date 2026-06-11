import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// クリック地点の近くにある「ライブカメラ」を Windy Webcams API から取得。
// APIキーはサーバー側のみ（WINDY_WEBCAMS_API_KEY）。近くに無ければ空配列（UIは非表示）。

export interface Webcam {
  id: number
  title: string
  preview: string   // 現在のライブ画像
  detail: string    // Windy の詳細ページ
  dist: number      // メートル
  city: string
  updated: string   // ISO
  lat: number       // カメラ位置（地図ピン用）
  lng: number
}

const KEY = process.env.WINDY_WEBCAMS_API_KEY
const RADIUS_KM = 25
const CACHE_TTL = 20 * 60 * 1000   // 20分（ライブだがクォータ節約のためキャッシュ）
const cache = new Map<string, { data: Webcam[]; ts: number }>()

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000, toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export async function GET(req: NextRequest) {
  if (!KEY) return NextResponse.json({ webcams: [] })   // キー未設定なら無効
  const sp = req.nextUrl.searchParams
  const lat = parseFloat(sp.get('lat') ?? '')
  const lng = parseFloat(sp.get('lng') ?? '')
  if (Number.isNaN(lat) || Number.isNaN(lng)) return NextResponse.json({ webcams: [] })

  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return NextResponse.json({ webcams: hit.data })

  try {
    const res = await fetch(
      `https://api.windy.com/webcams/api/v3/webcams?nearby=${lat},${lng},${RADIUS_KM}&limit=12&include=images,location,urls`,
      { headers: { 'x-windy-api-key': KEY }, cache: 'no-store', signal: AbortSignal.timeout(7000) }
    )
    if (!res.ok) throw new Error(`Windy ${res.status}`)
    const j = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const webcams: Webcam[] = (j?.webcams ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((w: any) => w.status === 'active' && w.images?.current?.preview && w.location)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((w: any) => ({
        id: w.webcamId,
        title: w.title ?? '',
        preview: w.images.current.preview,
        detail: w.urls?.detail ?? `https://www.windy.com/webcams/${w.webcamId}`,
        dist: Math.round(haversine(lat, lng, w.location.latitude, w.location.longitude)),
        city: w.location.city ?? '',
        updated: w.lastUpdatedOn ?? '',
        lat: w.location.latitude,
        lng: w.location.longitude,
      }))
      .sort((a: Webcam, b: Webcam) => a.dist - b.dist)
      .slice(0, 6)

    cache.set(key, { data: webcams, ts: Date.now() })
    if (cache.size > 1000) { for (const [k, v] of cache) if (Date.now() - v.ts > CACHE_TTL) cache.delete(k) }
    return NextResponse.json({ webcams })
  } catch (e) {
    console.warn('[webcams]', e)
    return NextResponse.json({ webcams: [] })   // 失敗時は静かに空
  }
}
