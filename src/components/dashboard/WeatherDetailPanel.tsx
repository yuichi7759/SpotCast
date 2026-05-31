'use client'
import { useEffect, useState } from 'react'
import type { Field, WeatherData } from '@/types/field'
import type { HourlyWeather, HourlyPoint } from '@/app/api/weather/hourly/route'

interface Props {
  point: Field | null
  onClose?: () => void
  refreshKey?: number
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
const RH = { time: 22, icon: 36, temp: 28, rain: 26 }
const CELL_W = 44
const LABEL_W = 36

export default function WeatherDetailPanel({ point, onClose, refreshKey }: Props) {
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

      {/* A. Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: accentColor, boxShadow: `0 0 7px ${accentColor}99`,
            }} />
            <div style={{
              fontSize: 17, fontWeight: 800, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {point.name}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                flexShrink: 0,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)' }}
            >
              <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
              </svg>
            </button>
          )}
        </div>
        {point.lat != null && point.lng != null && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, paddingLeft: 18 }}>
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </div>
        )}
      </div>

      {!hasCoords ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, textAlign: 'center',
          color: 'rgba(255,255,255,0.35)', fontSize: 15, lineHeight: 1.7,
        }}>
          地図上でポイントを<br />設定してください
        </div>
      ) : (
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* B. 現在の天気 */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            {loadingW ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ShimmerBlock width={120} height={44} borderRadius={8} />
                <ShimmerBlock width={200} height={16} />
              </div>
            ) : weather ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                      {weather.current.temp}
                    </span>
                    <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>°C</span>
                  </div>
                  <span style={{ fontSize: 32 }}>{weatherIcon(weather.current.weather_main)}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>💧 {weather.current.humidity}%</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>💨 {weather.current.wind_speed}m/s</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>体感 {weather.current.feels_like}°C</span>
                </div>
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>取得できません</div>
            )}
          </div>

          {/* C. 時間別予報 — tenki.jp スタイルのテーブル */}
          <div>
            <div style={{
              fontSize: 13, fontWeight: 700,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 10,
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              時間別予報
            </div>

            {loadingH ? (
              <ShimmerBlock width="100%" height={140} borderRadius={10} />
            ) : hourly && hourly.hourly && hourly.hourly.length > 0 ? (() => {
              const groups = groupByDay(hourly.hourly.slice(0, 48))
              const SEP = 'rgba(255,255,255,0.05)'
              const LABEL_BG = 'rgba(8,12,18,0.95)'

              return (
                <div style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  {groups.map((g, gi) => (
                    <div key={gi} style={{
                      borderTop: gi > 0 ? `1px solid rgba(255,255,255,0.08)` : undefined,
                    }}>

                      {/* Day header */}
                      <div style={{
                        padding: '6px 10px 6px',
                        background: 'rgba(255,255,255,0.03)',
                        borderBottom: `1px solid ${SEP}`,
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                          {g.dayLabel}
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>
                            {g.dateStr}
                          </span>
                        </span>
                        {g.tempMax !== null && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>
                            ↑{g.tempMax}°
                          </span>
                        )}
                        {g.tempMin !== null && (
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#93c5fd' }}>
                            ↓{g.tempMin}°
                          </span>
                        )}
                      </div>

                      {/* Table: fixed label col + scrollable data cols */}
                      <div style={{ display: 'flex' }}>

                        {/* Label column */}
                        <div style={{
                          width: LABEL_W, flexShrink: 0,
                          borderRight: `1px solid ${SEP}`,
                          background: LABEL_BG,
                        }}>
                          {[
                            { h: RH.time, label: '時刻' },
                            { h: RH.icon, label: '天気' },
                            { h: RH.temp, label: '気温' },
                            { h: RH.rain, label: '降水' },
                          ].map(({ h, label }, ri) => (
                            <div key={ri} style={{
                              height: h,
                              display: 'flex', alignItems: 'center',
                              paddingLeft: 6,
                              borderBottom: ri < 3 ? `1px solid ${SEP}` : undefined,
                            }}>
                              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.02em' }}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Scrollable data columns */}
                        <div
                          className="wdp-scroll"
                          style={{ overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}
                        >
                          <div style={{ display: 'flex', minWidth: 'max-content' }}>
                            {g.items.map((h, hi) => {
                              const timeLabel = h.time.replace(':00', '').replace(/^0/, '') + '時'
                              const icon = weatherIcon(wmoToMain(h.weather_code))
                              const isNow = gi === 0 && hi === 0
                              return (
                                <div key={hi} style={{
                                  width: CELL_W, flexShrink: 0,
                                  borderLeft: hi > 0 ? `1px solid ${SEP}` : undefined,
                                  background: isNow ? 'rgba(29,78,216,0.12)' : undefined,
                                }}>
                                  {/* 時刻 */}
                                  <div style={{
                                    height: RH.time,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderBottom: `1px solid ${SEP}`,
                                  }}>
                                    <span style={{
                                      fontSize: 11, fontWeight: isNow ? 800 : 600,
                                      color: isNow ? '#60a5fa' : 'rgba(255,255,255,0.55)',
                                    }}>{timeLabel}</span>
                                  </div>
                                  {/* 天気 */}
                                  <div style={{
                                    height: RH.icon,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderBottom: `1px solid ${SEP}`,
                                  }}>
                                    <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
                                  </div>
                                  {/* 気温 */}
                                  <div style={{
                                    height: RH.temp,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderBottom: `1px solid ${SEP}`,
                                  }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: tempColor(h.temp) }}>
                                      {h.temp}°
                                    </span>
                                  </div>
                                  {/* 降水% */}
                                  <div style={{
                                    height: RH.rain,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: rainBg(h.rain_prob),
                                  }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: rainTextColor(h.rain_prob) }}>
                                      {h.rain_prob > 0 ? `${h.rain_prob}%` : '—'}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )
            })() : (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>取得できません</div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
