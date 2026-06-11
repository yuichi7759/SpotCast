'use client'
import { useEffect, useState } from 'react'
import type { Field, WeatherData } from '@/types/field'
import type { HourlyWeather, HourlyPoint } from '@/app/api/weather/hourly/route'
import { useLocale } from '@/components/LocaleProvider'

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
  if (t >= 35) return 'var(--w-temp1)'
  if (t >= 30) return 'var(--w-temp2)'
  if (t >= 25) return 'var(--w-temp3)'
  if (t >= 20) return 'var(--w-temp4)'
  if (t >= 15) return 'var(--w-temp5)'
  if (t >= 10) return 'var(--w-temp6)'
  return 'var(--w-temp7)'
}
function rainBg(p: number): string {
  if (p >= 70) return 'rgba(59,130,246,0.28)'
  if (p >= 50) return 'rgba(96,165,250,0.18)'
  if (p >= 30) return 'rgba(147,197,253,0.10)'
  return 'transparent'
}
function rainTextColor(p: number): string {
  if (p >= 50) return 'var(--w-rain-hi)'
  if (p >= 30) return 'var(--w-rain-mid)'
  return 'var(--dash-text-4)'
}

function ShimmerBlock({ width, height, borderRadius = 6 }: { width: number | string; height: number; borderRadius?: number }) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'var(--dash-border)',
      animation: 'shimmerWDP 1.5s infinite',
    }} />
  )
}

// Row heights — must match between label column and data columns
const RH = { time: 28, icon: 46, temp: 36, rain: 32 }
const CELL_W = 54
const LABEL_W = 58

export default function WeatherDetailPanel({ point, onClose, refreshKey, plan = 'standard' }: Props) {
  const { t, locale } = useLocale()
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
      .then(r => r.json()).then(d => { if (d && d.current) setWeather(d) }).catch(() => {})
      .finally(() => setLoadingW(false))

    fetch(`/api/weather/hourly?lat=${point.lat}&lng=${point.lng}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null).then(d => { if (d?.hourly) setHourly(d) }).catch(() => {})
      .finally(() => setLoadingH(false))
  }, [point?.id, point?.lat, point?.lng, hasCoords, refreshKey])

  if (!point) return null

  const accentColor = point.color ?? '#60a5fa'

  // Group hourly data into days. Each hourly point carries its OWN location-local
  // date (h.date, "YYYY-MM-DD"), so day boundaries, date labels, and the daily
  // lookup are all keyed off the point's local time — never the viewer's browser
  // timezone. (A Japan user viewing New York sees New York's local days.)
  type DailyEntry = NonNullable<typeof hourly>['daily14'][number]
  function groupByDay(items: HourlyPoint[]) {
    const groups: Array<{
      offset: number
      date: string                 // location-local "YYYY-MM-DD"
      dateStr: string
      dayLabel: string
      daily: DailyEntry | null
      tempMax: number | null
      tempMin: number | null
      items: HourlyPoint[]
    }> = []

    // Split by distinct local date (handles missing hours / DST without relying on HH wrap).
    items.forEach((h) => {
      const last = groups[groups.length - 1]
      if (!last || last.date !== h.date) {
        groups.push({ offset: groups.length, date: h.date, dateStr: '', dayLabel: '', daily: null, tempMax: null, tempMin: null, items: [h] })
      } else {
        last.items.push(h)
      }
    })

    const baseDate = items[0]?.date ?? ''   // location-local "today"
    return groups.map(g => {
      const [, mm, dd] = g.date.split('-')
      const md = `${parseInt(mm, 10)}/${parseInt(dd, 10)}`
      // Day offset relative to the point's local today (UTC-anchored diff, no browser TZ).
      const diffDays = Math.round((Date.parse(g.date + 'T00:00:00Z') - Date.parse(baseDate + 'T00:00:00Z')) / 86400000)
      const dayLabel = diffDays === 0 ? t('weather.today') : diffDays === 1 ? t('weather.tomorrow') : md
      const daily = hourly?.daily14?.find(day => day.date === g.date) ?? null
      return { ...g, dateStr: md, dayLabel, daily, tempMax: daily?.temp_max ?? null, tempMin: daily?.temp_min ?? null }
    })
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--dash-panel)',
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
        borderBottom: '1px solid var(--dash-border)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: accentColor, boxShadow: `0 0 6px ${accentColor}99` }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--dash-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {point.name}
          </span>
          {point.lat != null && point.lng != null && (
            <span style={{ fontSize: 11, color: 'var(--dash-text-4)', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} style={{ flexShrink: 0, background: 'var(--dash-surface2)', border: '1px solid var(--dash-border)', borderRadius: 7, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--dash-text-3)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--dash-text)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--dash-text-3)' }}
          >
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
            </svg>
          </button>
        )}
      </div>

      {!hasCoords ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-text-4)', fontSize: 14, textAlign: 'center', padding: 20 }}>
          {t('weather.setPoint')}
        </div>
      ) : (
        <div style={{ flex: '1 0 auto', padding: '10px 12px', overflow: 'visible' }}>
          {loadingH ? (
            <ShimmerBlock width="100%" height={160} borderRadius={10} />
          ) : hourly && hourly.hourly && hourly.hourly.length > 0 ? (() => {
            const maxHours = plan === 'free' ? 24 : 48
            const groups   = groupByDay(hourly.hourly.slice(0, maxHours))
            const allItems = groups.flatMap((g, gi) => g.items.map((h, hi) => ({ h, gi, hi, g })))
            const SEP      = 'var(--dash-border)'
            const DAY_SEP  = 'var(--dash-border-strong)'
            const LABEL_BG = 'var(--dash-panel-solid)'
            const DAY_H    = 30  // 日別サマリー行の高さ

            // ── 統合チャート（気温=赤線 / 降水量mm=水色棒）用の計算 ──
            const CHART_H = 76
            const padT = 14, padB = 10
            const plotH = CHART_H - padT - padB
            const tempVals = allItems.map(a => a.h.temp)
            const tMin = Math.min(...tempVals)
            const tMax = Math.max(...tempVals)
            const tRange = Math.max(1, tMax - tMin)
            const precVals = allItems.map(a => a.h.precip ?? 0)
            const pMax = Math.max(4, ...precVals)   // 最低4mmスケール（小雨でも見える）
            const tx = (i: number) => i * CELL_W + CELL_W / 2
            const ty = (t: number) => padT + (1 - (t - tMin) / tRange) * plotH
            const linePts = allItems.map((a, i) => `${tx(i)},${ty(a.h.temp)}`).join(' ')

            return (
              <div style={{ border: '1px solid var(--dash-border)', borderRadius: 10, overflow: 'hidden', background: 'var(--dash-surface)', display: 'flex' }}>

                {/* 固定ラベル列 */}
                <div style={{ width: LABEL_W, flexShrink: 0, borderRight: `1px solid ${SEP}`, background: LABEL_BG, zIndex: 2 }}>
                  <div style={{ height: DAY_H, borderBottom: `1px solid ${SEP}` }} />
                  {[{ h: RH.time, label: t('weather.rowTime') }, { h: RH.icon, label: t('weather.rowSky') }, { h: RH.temp, label: t('weather.rowTemp') }, { h: RH.rain, label: t('weather.rowRain') }].map(({ h, label }, ri) => (
                    <div key={ri} style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${SEP}` }}>
                      <span style={{ fontSize: 10, color: 'var(--dash-text-3)', fontWeight: 700 }}>{label}</span>
                    </div>
                  ))}
                  {/* チャート縦軸（左=気温/赤, 右=降水mm/青） */}
                  <div style={{ height: CHART_H, position: 'relative' }}>
                    {/* 気温軸 */}
                    <span style={{ position: 'absolute', left: 3, top: padT - 7, fontSize: 11, fontWeight: 700, color: 'var(--w-temp1)' }}>{Math.round(tMax)}°</span>
                    <span style={{ position: 'absolute', left: 3, top: CHART_H - padB - 7, fontSize: 11, fontWeight: 700, color: 'var(--w-temp1)' }}>{Math.round(tMin)}°</span>
                    {/* 降水量軸 */}
                    <span style={{ position: 'absolute', right: 3, top: padT - 7, fontSize: 11, fontWeight: 700, color: 'var(--w-rain-hi)' }}>{Math.round(pMax)}</span>
                    <span style={{ position: 'absolute', right: 3, top: CHART_H - padB - 7, fontSize: 11, fontWeight: 700, color: 'var(--w-rain-hi)' }}>mm</span>
                  </div>
                </div>

                {/* 横スクロール */}
                <div className="wdp-scroll" style={{ overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
                  <div style={{ minWidth: 'max-content' }}>
                  <div style={{ display: 'flex' }}>
                    {allItems.map(({ h, gi, hi, g }, idx) => {
                      const isDayStart = hi === 0
                      const isNow      = idx === 0
                      // ja: 「14時」/ en: 「14:00」（現地時刻のまま）
                      const timeLabel  = locale === 'ja' ? h.time.replace(':00', '').replace(/^0/, '') + '時' : h.time
                      const icon       = weatherIcon(wmoToMain(h.weather_code))
                      const borderL    = isDayStart && idx > 0 ? `2px solid ${DAY_SEP}` : idx > 0 ? `1px solid ${SEP}` : undefined

                      return (
                        <div key={idx} style={{ width: CELL_W, flexShrink: 0, borderLeft: borderL, background: isNow ? 'var(--dash-accent-bg)' : undefined, position: 'relative' }}>

                          {/* 日別サマリー行 — 日付が変わる列だけoverflowで横に伸ばす */}
                          <div style={{ height: DAY_H, borderBottom: `1px solid ${SEP}`, background: isDayStart ? 'var(--dash-surface)' : undefined, position: 'relative', overflow: 'visible' }}>
                            {isDayStart && (() => {
                              const daily = g.daily   // 既にグループ確定時に現地日付でマッチ済み
                              return (
                                <div style={{ position: 'absolute', left: 4, top: 0, height: DAY_H, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', zIndex: 1, pointerEvents: 'none' }}>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: gi === 0 ? 'var(--w-accent)' : 'var(--dash-text-2)' }}>{g.dayLabel}</span>
                                  {daily && <>
                                    <span style={{ fontSize: 14 }}>{weatherIcon(wmoToMain(daily.weather_code))}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--w-tmax)' }}>{daily.temp_max}°</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--w-tmin)' }}>{daily.temp_min}°</span>
                                    {daily.rain_prob > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--w-rain-hi)' }}>{daily.rain_prob}%</span>}
                                  </>}
                                </div>
                              )
                            })()}
                          </div>

                          {/* 時刻 */}
                          <div style={{ height: RH.time, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${SEP}` }}>
                            <span style={{ fontSize: 12, fontWeight: isNow ? 800 : 600, color: isNow ? 'var(--w-accent)' : 'var(--dash-text-2)' }}>{timeLabel}</span>
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
                            <span style={{ fontSize: 12, fontWeight: 700, color: h.rain_prob > 0 ? rainTextColor(h.rain_prob) : 'var(--dash-text-3)' }}>
                              {h.rain_prob > 0 ? `${h.rain_prob}%` : '—'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 統合チャート: 気温=赤線 / 降水量mm=水色棒（列幅・横スクロール連動） */}
                  <svg
                    width={allItems.length * CELL_W}
                    height={CHART_H}
                    style={{ display: 'block', borderTop: `1px solid ${SEP}` }}
                  >
                    {/* グリッド線（上=最大ライン / 下=基準線） */}
                    <line x1={0} y1={padT} x2={allItems.length * CELL_W} y2={padT} stroke="var(--dash-border)" strokeWidth={1} strokeDasharray="3 3" />
                    <line x1={0} y1={CHART_H - padB} x2={allItems.length * CELL_W} y2={CHART_H - padB} stroke="var(--dash-border)" strokeWidth={1} />
                    {/* 降水量バー */}
                    {allItems.map((a, i) => {
                      const p = a.h.precip ?? 0
                      if (p <= 0) return null
                      const bh = (p / pMax) * plotH
                      return (
                        <rect
                          key={`b${i}`}
                          x={i * CELL_W + CELL_W * 0.28}
                          y={CHART_H - padB - bh}
                          width={CELL_W * 0.44}
                          height={bh}
                          rx={1}
                          fill="var(--w-rain-hi)"
                          opacity={0.7}
                        />
                      )
                    })}
                    {/* 気温の折れ線 */}
                    <polyline points={linePts} fill="none" stroke="var(--w-temp1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                    {allItems.map((a, i) => (
                      <circle key={`c${i}`} cx={tx(i)} cy={ty(a.h.temp)} r={1.7} fill="var(--w-temp1)" />
                    ))}
                  </svg>
                  </div>
                </div>
              </div>
            )
          })() : (
            <div style={{ color: 'var(--dash-text-4)', fontSize: 13, paddingTop: 12 }}>{t('weather.unavailable')}</div>
          )}

          {plan === 'free' && hourly && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)', fontSize: 12, color: 'rgba(251,191,36,0.9)', textAlign: 'center' }}>
              ⚡ {t('weather.freeBanner')}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
