// 地図マーカーのサイズ設定（localStorage 共有）。
// 設定画面で変更 → ダッシュボード再表示時に MapView が反映する。

export type MarkerSize = 'sm' | 'md' | 'lg'
export const MARKER_SIZE_KEY = 'spotcast:markerSize'

const SCALE: Record<MarkerSize, number> = { sm: 0.7, md: 1.0, lg: 1.5 }

export const MARKER_SIZE_OPTIONS: { id: MarkerSize; label: string }[] = [
  { id: 'sm', label: '小' },
  { id: 'md', label: '標準' },
  { id: 'lg', label: '大' },
]

export function loadMarkerSize(): MarkerSize {
  if (typeof window === 'undefined') return 'md'
  const v = localStorage.getItem(MARKER_SIZE_KEY) as MarkerSize | null
  return v && v in SCALE ? v : 'md'
}

export function saveMarkerSize(size: MarkerSize): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MARKER_SIZE_KEY, size)
    window.dispatchEvent(new CustomEvent('spotcast:markerSizeChange', { detail: size }))
  } catch {}
}

export function markerScale(size: MarkerSize = loadMarkerSize()): number {
  return SCALE[size] ?? 1
}
