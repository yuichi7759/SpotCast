// マーカークリック時のズームレベル（localStorage・デフォルト12=控えめ）

export const MARKER_ZOOM_KEY = 'spotcast:markerZoom'

export const MARKER_ZOOM_OPTIONS: { id: string; label: string; zoom: number }[] = [
  { id: 'wide',   label: '広域', zoom: 9 },
  { id: 'normal', label: '標準', zoom: 12 },
  { id: 'detail', label: '詳細', zoom: 14 },
  { id: 'max',    label: '拡大', zoom: 16 },
]

const DEFAULT_ZOOM = 12

export function loadMarkerZoom(): number {
  if (typeof window === 'undefined') return DEFAULT_ZOOM
  const v = Number(localStorage.getItem(MARKER_ZOOM_KEY))
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_ZOOM
}

export function saveMarkerZoom(zoom: number): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(MARKER_ZOOM_KEY, String(zoom)) } catch {}
}
