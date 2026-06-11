// ライブカメラ＋見どころの地図表示ON/OFF（localStorage共有・デフォルトOFF）

export const MEDIA_STRIP_KEY = 'spotcast:mediaStrip'

export function loadMediaStrip(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(MEDIA_STRIP_KEY) === '1'   // 未設定＝デフォOFF
}

export function saveMediaStrip(on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(MEDIA_STRIP_KEY, on ? '1' : '0')
    window.dispatchEvent(new CustomEvent('spotcast:mediaStripChange', { detail: on }))
  } catch {}
}
