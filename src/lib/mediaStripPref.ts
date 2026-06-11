// ライブカメラ／周辺の見どころ の地図表示ON/OFF（localStorage共有・各デフォルトOFF）
// カメラと見どころは別々に切り替え可能。

const CAMERAS_KEY = 'spotcast:cameras'
const HIGHLIGHTS_KEY = 'spotcast:highlights'

function load(key: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(key) === '1'   // 未設定＝デフォOFF
}

function save(key: string, evt: string, on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, on ? '1' : '0')
    window.dispatchEvent(new CustomEvent(evt, { detail: on }))
  } catch {}
}

export const CAMERAS_EVENT = 'spotcast:camerasChange'
export const HIGHLIGHTS_EVENT = 'spotcast:highlightsChange'

export function loadCameras(): boolean { return load(CAMERAS_KEY) }
export function saveCameras(on: boolean): void { save(CAMERAS_KEY, CAMERAS_EVENT, on) }
export function loadHighlights(): boolean { return load(HIGHLIGHTS_KEY) }
export function saveHighlights(on: boolean): void { save(HIGHLIGHTS_KEY, HIGHLIGHTS_EVENT, on) }
