import { NextRequest } from 'next/server'
import sharp from 'sharp'

const MAX_ZOOM = 7   // RainViewer only has data tiles at z≤7; higher z is served by cropping

// ── In-memory tile cache ────────────────────────────────────────────────────
// Prevents repeated RainViewer fetches during animation playback (429 guard).
// Key: "<radarPath>/<z>/<x>/<y>"
const CACHE_TTL = 5 * 60 * 1000  // 5 min

const tileCache  = new Map<string, { data: ArrayBuffer; ts: number }>()
const inFlight   = new Map<string, Promise<ArrayBuffer>>()   // dedup concurrent requests

function cacheGet(key: string): ArrayBuffer | null {
  const entry = tileCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { tileCache.delete(key); return null }
  return entry.data
}

function cachePut(key: string, data: ArrayBuffer) {
  tileCache.set(key, { data, ts: Date.now() })
  // Evict stale entries periodically (keep memory usage bounded)
  if (tileCache.size > 2000) {
    const cutoff = Date.now() - CACHE_TTL
    for (const [k, v] of tileCache) {
      if (v.ts < cutoff) tileCache.delete(k)
    }
  }
}

/** Fetch a raw PNG tile from RainViewer, with caching + in-flight dedup. */
async function fetchRawTile(radarPath: string, z: number, x: number, y: number): Promise<ArrayBuffer | null> {
  const key = `${radarPath}/${z}/${x}/${y}`

  // 1. Cache hit
  const cached = cacheGet(key)
  if (cached) return cached

  // 2. In-flight dedup
  const flying = inFlight.get(key)
  if (flying) {
    try { return await flying } catch { return null }
  }

  // 3. New fetch
  const url = `https://tilecache.rainviewer.com${radarPath}/256/${z}/${x}/${y}/4/1_1.png`
  const promise = fetch(url, { signal: AbortSignal.timeout(8000) })
    .then(async res => {
      if (!res.ok) throw new Error(`${res.status}`)
      const buf = await res.arrayBuffer()
      cachePut(key, buf)
      return buf
    })
    .finally(() => { inFlight.delete(key) })

  inFlight.set(key, promise)
  try { return await promise } catch { return null }
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z: zStr, x: xStr, y: yStr } = await params
  const radarPath = request.nextUrl.searchParams.get('p')

  if (!radarPath) {
    return new Response('Missing radar path param', { status: 400 })
  }

  const zReq = parseInt(zStr, 10)
  const xReq = parseInt(xStr, 10)
  const yReq = parseInt(yStr, 10)

  const headers = {
    'Content-Type': 'image/png',
    'Cache-Control': 'public, max-age=300',
  }

  if (zReq <= MAX_ZOOM) {
    // Within RainViewer's supported zoom range — fetch directly
    const buf = await fetchRawTile(radarPath, zReq, xReq, yReq)
    if (!buf) return new Response(null, { status: 502 })
    return new Response(buf, { headers })
  }

  // z > MAX_ZOOM: fetch the parent z=MAX_ZOOM tile and crop the correct sub-region
  const d       = zReq - MAX_ZOOM          // zoom difference
  const parentX = xReq >> d               // parent tile x
  const parentY = yReq >> d               // parent tile y
  const tileSize = 256 >> d               // sub-tile size in pixels (256 / 2^d)
  const cropX   = (xReq % (1 << d)) * tileSize
  const cropY   = (yReq % (1 << d)) * tileSize

  const buf = await fetchRawTile(radarPath, MAX_ZOOM, parentX, parentY)
  if (!buf) return new Response(null, { status: 502 })

  // Crop the sub-region and upscale to 256×256 (nearest = keeps radar color blocks crisp)
  const out = await sharp(Buffer.from(buf))
    .extract({ left: cropX, top: cropY, width: Math.max(1, tileSize), height: Math.max(1, tileSize) })
    .resize(256, 256, { kernel: 'nearest' })
    .png()
    .toBuffer()

  return new Response(out.buffer as ArrayBuffer, { headers })
}
