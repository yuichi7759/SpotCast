'use client'
import { useEffect, useState } from 'react'
import type { Field, WeatherData } from '@/types/field'
import type { HourlyWeather, HourlyPoint } from '@/app/api/weather/hourly/route'

interface Props {
  point: Field | null
  onClose?: () => void
  refreshKey?: number
  plan?: 'free' | 'standard'
}

const WEATHER_ICON: Record<string, string> = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Fog: '🌫️',
}
function weatherIcon(main: string): string {
  return WEATHER_ICON[main] ?? '🌫️'
}
function wmoToMain(code: number): string {
  if (code === 0)                 return 'Clear'
  if (code <= 3)                  return 'Clouds'
  if (code === 45 || code === 48) return 'Fog'
  if (code >= 51 && code <= 55)   return 'Drizzle'
  if (code >= 56 && code <= 57)   return 'Drizzle'
  if (code >= 61 && code <= 67)   return 'Rain'
  if (code >= 71 && code <= 77)   return 'Snow'
  if (code >= 80 && code <= 82)   return 'Rain'
  if (code === 85 || code === 86) return 'Snow'
  if (code >= 95)                 return 'Thunderstorm'
  return 'Clouds'
}

function tempColor(t: number): string {
  if (t >= 35) return '#ef4444'
  if (t >= 30) return '#f97316'
  if (t >= 25) return '#fbbf24'
  if (t >= 20) return '#86efac'
  if (t >= 15) return '#34d399'
  if (t >= 10) return '#38bdf8'
  return '#818cf8'
}
function rainBg(p: number): string {
  if (p >= 70) return 'rgba(59,130,246,0.28)'
  if (p >= 50) return 'rgba(96,165,250,0.18)'
  if (p >= 30) return 'rgba(147,197,253,0.10)'
  return 'transparent'
}
function rainTextColor(p: number): string {
  if (p >= 50) return '#93c5fd'
  if (p >= 30) return '#bfdbfe'
  return 'rgba(255,255,255,0.3)'
}

function ShimmerBlock({ width, height, borderRadius = 6 }: { width: number | string; height: number; borderRadius?: number }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'rgba(255,255,255,0.07)',
      animation: 'shimmerWDP 1.5s infinite',
    }} />
  )
}

// Row heights — must match between label column and data columns
const RH = { time: 28, icon: 46, temp: 36, rain: 32 }
const CELL_W = 54
const LABEL_W = 40

export default function WeatherDetailPanel({ point, onClose, refreshKey, plan = 'standard' }: Props) {
  const [weather, setWeather]   = useState<WeatherData | null>(null)
  const [hourly,  setHourly]    = useState<HourlyWeather | null>(null)
  const [loadingW, setLoadingW] = useState(false)
  const [loadingH, setLoadingH] = useState(false)

  const hasCoords = point?.lat != null && point?.lng != null

  useEffect(() => {
    if (!point || !hasCoords) { setWeather(null); setHourly(null); return }
    setLoadingW(true); setLoadingH(true)
    setWeather(null);  setHourly(null)

    fetch(`/api/weather?lat=${point.lat}&lng=${point.lng}`, { cache: 'no-store' })
      .then(r => r.json()).then(setWeather).catch(() => {})
      .finally(() => setLoadingW(false))

    fetch(`/api/weather/hourly?lat=${point.lat}&lng=${point.lng}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).then(d => { if (d?.hourly) setHourly(d) }).catch(() => {})
      .finally(() => setLoadingH(false))
  }, [point?.id, point?.lat, point?.lng, hasCoords, refreshKey])

  if (!point) return null

  const accentColor = point.color ?? '#60a5fa'

  // Group hourly data into days by detecting midnight crossings
  function groupByDay(items: HourlyPoint[]) {
    const today = new Date()
    const groups: Array<{
      offset: number
      dateStr: string
      dayLabel: string
      tempMax: number | null
      tempMin: number | null
      items: HourlyPoint[]
    }> = []

    let offset = 0
    let cur: typeof groups[0] = { offset: 0, dateStr: '', dayLabel: '', tempMax: null, tempMin: null, items: [] }

    items.forEach((h, i) => {
      if (i > 0) {
        const prev = parseInt(items[i - 1].time.split(':')[0], 10)
        const now  = parseInt(h.time.split(':')[0], 10)
        if (now < prev) {
          groups.push(cur)
          offset++
          cur = { offset, dateStr: '', dayLabel: '', tempMax: null, tempMin: null, items: [] }
        }
      }
      cur.items.push(h)
    })
    if (cur.items.length > 0) groups.push(cur)

    return groups.map(g => {
      const d = new Date(today)
      d.setDate(d.getDate() + g.offset)
      const dateStr  = `${d.getMonth() + 1}/${d.getDate()}`
      const dayLabel = g.offset === 0 ? '今日' : g.offset === 1 ? '明日' : `${d.getMonth() + 1}/${d.getDate()}`
      const daily = hourly?.daily14?.find(day => {
        const dd = new Date(day.date)
        return dd.getDate() === d.getDate() && dd.getMonth() === d.getMonth()
      }) ?? null
      return { ...g, dateStr, dayLabel, tempMax: daily?.temp_max ?? null, tempMin: daily?.temp_min ?? null }
    })
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(8,12,18,0.94)',
      overflowY: 'auto',
      scrollbarWidth: 'none',
    }}>
      <style>{`
        @keyframes shimmerWDP { 0%,100%{opacity:.3} 50%{opacity:.7} }
        .wdp-scroll::-webkit-scrollbar { display: none }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: accentColor, boxShadow: `0 0 6px ${accentColor}99` }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {point.name}
          </span>
          {point.lat != null && point.lng != null && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} style={{ flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)' }}
          >
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
            </svg>
          </button>
        )}
      </div>

      {!hasCoords ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center', padding: 20 }}>
          地図上でポイントを設定してください
        </div>
      ) : (
        <div style={{ flex: 1, padding: '10px 12px', overflow: 'hidden' }}>
          {loadingH ? (
            <ShimmerBlock width="100%" height={160} borderRadius={10} />
          ) : hourly && hourly.hourly && hourly.hourly.length > 0 ? (() => {
            const maxHours = plan === 'free' ? 24 : 48
            const groups   = groupByDay(hourly.hourly.slice(0, maxHours))
            const allItems = groups.flatMap((g, gi) => g.items.map((h, hi) => ({ h, gi, hi, g })))
            const SEP      = 'rgba(255,255,255,0.07)'
            const DAY_SEP  = 'rgba(255,255,255,0.22)'
            const LABEL_BG = 'rgba(8,12,18,0.98)'
            const DAY_H    = 30  // 日別サマリー行の高さ

            return (
              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', display: 'flex', height: '100%' }}>

                {/* 固定ラベル列 */}
                <div style={{ width: LABEL_W, flexShrink: 0, borderRight: `1px solid ${SEP}`, background: LABEL_BG, zIndex: 2 }}>
                  <div style={{ height: DAY_H, borderBottom: `1px solid ${SEP}` }} />
                  {[{ h: RH.time, label: '時刻' }, { h: RH.icon, label: '天気' }, { h: RH.temp, label: '気温' }, { h: RH.rain, label: '降水' }].map(({ h, label }, ri) => (
                    <div key={ri} style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: ri < 3 ? `1px solid ${SEP}` : undefined }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* 横スクロール */}
                <div className="wdp-scroll" style={{ overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
                  <div style={{ display: 'flex', minWidth: 'max-content' }}>
                    {allItems.map(({ h, gi, hi, g }, idx) => {
                      const isDayStart = hi === 0
                      const isNow      = idx === 0
                      const timeLabel  = h.time.replace(':00', '').replace(/^0/, '') + '時'
                      const icon       = weatherIcon(wmoToMain(h.weather_code))
                      const borderL    = isDayStart && idx > 0 ? `2px solid ${DAY_SEP}` : idx > 0 ? `1px solid ${SEP}` : undefined

                      return (
                        <div key={idx} style={{ width: CELL_W, flexShrink: 0, borderLeft: borderL, background: isNow ? 'rgba(29,78,216,0.12)' : undefined, position: 'relative' }}>

                          {/* 日別サマリー行 — 日付が変わる列だけoverflowで横に伸ばす */}
                          <div style={{ height: DAY_H, borderBottom: `1px solid ${SEP}`, background: isDayStart ? 'rgba(255,255,255,0.04)' : undefined, position: 'relative', overflow: 'visible' }}>
                            {isDayStart && (() => {
                              const daily = hourly?.daily14?.find(d => {
                                const today = new Date(); const dd = new Date(today); dd.setDate(dd.getDate() + g.offset)
                                const ddate = new Date(d.date)
                                return ddate.getDate() === dd.getDate() && ddate.getMonth() === dd.getMonth()
                              })
                              return (
                                <div style={{ position: 'absolute', left: 4, top: 0, height: DAY_H, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', zIndex: 1, pointerEvents: 'none' }}>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: gi === 0 ? '#60a5fa' : 'rgba(255,255,255,0.75)' }}>{g.dayLabel}</span>
                                  {daily && <>
                                    <span style={{ fontSize: 14 }}>{weatherIcon(wmoToMain(daily.weather_code))}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316' }}>{daily.temp_max}°</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#93c5fd' }}>{daily.temp_min}°</span>
                                    {daily.rain_prob > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#7dd3fc' }}>{daily.rain_prob}%</span>}
                                  </>}
                                </div>
                              )
                            })()}
                          </div>

                          {/* 時刻 */}
                          <div style={{ height: RH.time, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${SEP}` }}>
                            <span style={{ fontSize: 12, fontWeight: isNow ? 800 : 600, color: isNow ? '#60a5fa' : 'rgba(255,255,255,0.7)' }}>{timeLabel}</span>
                          </div>
                          {/* 天気 */}
                          <div style={{ height: RH.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${SEP}` }}>
                            <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
                          </div>
                          {/* 気温 */}
                          <div style={{ height: RH.temp, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${SEP}` }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: tempColor(h.temp) }}>{h.temp}°</span>
                          </div>
                          {/* 降水% */}
                          <div style={{ height: RH.rain, display: 'flex', alignItems: 'center', justifyContent: 'center', background: rainBg(h.rain_prob) }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: h.rain_prob > 0 ? rainTextColor(h.rain_prob) : 'rgba(255,255,255,0.4)' }}>
                              {h.rain_prob > 0 ? `${h.rain_prob}%` : '—'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })() : (
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, paddingTop: 12 }}>取得できません</div>
          )}

          {plan === 'free' && hourly && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)', fontSize: 12, color: 'rgba(251,191,36,0.9)', textAlign: 'center' }}>
              ⚡ Standardプランで48時間予報が利用できます
            </div>
          )}
        </div>
      )}
    </div>
  )
}
