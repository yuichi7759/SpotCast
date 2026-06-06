// 地図マーカー横の天気アイコン表示ON/OFF（localStorage共有・デフォルトON）

export const WEATHER_ICONS_KEY = 'spotcast:weatherIcons'

export function loadWeatherIcons(): boolean {
  if (typeof window === 'undefined') return true
  const v = localStorage.getItem(WEATHER_ICONS_KEY)
  return v === null ? true : v === '1'   // 未設定＝デフォON
}

export function saveWeatherIcons(on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(WEATHER_ICONS_KEY, on ? '1' : '0')
    window.dispatchEvent(new CustomEvent('spotcast:weatherIconsChange', { detail: on }))
  } catch {}
}
