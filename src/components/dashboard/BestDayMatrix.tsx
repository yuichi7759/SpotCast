'use client'
import { useEffect, useState, useMemo } from 'react'
import type { Field } from '@/types/field'
import type { HourlyWeather } from '@/app/api/weather/hourly/route'

export type ScoreMode = 'sunny' | 'rainy'

const DOW_JP = ['日', '月', '火', '水', '木', '金', '土']

const WEATHER_ICON: Record<string, string> = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Fog: '🌫️',
}

function wmoToMain(code: number): string {
  if (code === 0)                  return 'Clear'
  if (code <= 3)                   return 'Clouds'
  if (code === 45 || code === 48)  return 'Fog'
  if (code >= 51 && code <= 55)    return 'Drizzle'
  if (code >= 56 && code <= 57)    return 'Drizzle'
  if (code >= 61 && code <= 67)    return 'Rain'
  if (code >= 71 && code <= 77)    return 'Snow'
  if (code >= 80 && code <= 82)    return 'Rain'
  if (code === 85 || code === 86)  return 'Snow'
  if (code >= 95)                  return 'Thunderstorm'
  return 'Clouds'
}

function calcScore(
  weatherCode: number, rainProb: number,
  tempMax: number, tempMin: number,
  mode: ScoreMode,
  windMax = 0,
): number {
  const main = wmoToMain(weatherCode)
  let s = 50
  const avg = (tempMax + tempMin) / 2

  if (mode === 'sunny') {
    if (main === 'Clear')                           s += 30
    else if (main === 'Clouds')                     s += 10
    else if (main === 'Rain' || main === 'Drizzle') s -= 30
    else if (main === 'Thunderstorm')               s -= 50
    if      (rainProb < 10) s += 20
    else if (rainProb < 30) s += 10
    else if (rainProb > 80) s -= 30
    else if (rainProb > 60) s -= 20
    if      (avg >= 15 && avg <= 25) s += 15
    else if (avg < 5 || avg > 33)   s -= 20
  } else {
    if (main === 'Rain' || main === 'Drizzle') s += 30
    else if (main === 'Clouds')                s += 10
    else if (main === 'Clear')                 s -= 20
    else if (main === 'Thunderstorm')          s -= 20
    if      (rainProb > 70) s += 25
    else if (rainProb > 40) s += 15
    else if (rainProb < 10) s -= 25
    if      (avg >= 8 && avg <= 22) s += 10
    else if (avg > 35)              s -= 15
  }
  // Wind penalty (both modes)
  if (windMax >= 15) s -= 20
  else if (windMax >= 10) s -= 10
  return Math.max(0, Math.min(100, s))
}

function scoreColor(s: number): string {
  if (s >= 80) return '#3ecf8e'
  if (s >= 60) return '#60a5fa'
  if (s >= 40) return '#fbbf24'
  return '#f87171'
}
function scoreBg(s: number): string {
  if (s >= 80) return 'rgba(62,207,142,0.14)'
  if (s >= 60) return 'rgba(96,165,250,0.12)'
  if (s >= 40) return 'rgba(251,191,36,0.12)'
  return 'rgba(248,113,113,0.10)'
}

const MEDAL_COLORS = [
  { bg: '#2d2400', border: '#fbbf24', text: '#fbbf24' },
  { bg: '#1e2028', border: '#c0c0c0', text: '#e0e0e0' },
  { bg: '#261a08', border: '#cd7f32', text: '#cd7f32' },
]
const MEDALS = ['🥇', '🥈', '🥉']

const ROW_H    = 46   // px — point rows + aggregate row
const DATE_W   = 54   // px — each date column
const DATE_GAP = 2    // px — gap between date columns
const LABEL_W  = 148  // px — sticky left column

interface Props {
  allPoints: Field[]
  highlightPointId?: string
  refreshKey?: number
  plan?: 'free' | 'standard'
}

export default function BestDayMatrix({ allPoints, highlightPointId, refreshKey, plan = 'standard' }: Props) {
  const [mode, setMode]           = useState<ScoreMode>('sunny')
  const [hourlyData, setHourly]   = useState<Record<string, HourlyWeather | null>>({})
  const [loadingIds, setLoading]  = useState<Set<string>>(new Set())
  const [selectedIds, setSelected] = useState<Set<string>>(new Set())

  const geoPoints = useMemo(
    () => allPoints.filter(p => p.lat != null && p.lng != null),
    [allPoints],
  )

  // Auto-select newly added points
  useEffect(() => {
    setSelected(prev => {
      const next = new Set(prev)
      geoPoints.forEach(p => { if (!next.has(p.id)) next.add(p.id) })
      return next
    })
  }, [geoPoints.map(p => p.id).join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  // Points shown in matrix (selected subset)
  const activePoints = useMemo(
    () => geoPoints.filter(p => selectedIds.has(p.id)),
    [geoPoints, selectedIds],
  )

  function togglePoint(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Fetch hourly for all geo-points (re-fetch on refreshKey change)
  useEffect(() => {
    setHourly({})
    setLoading(new Set())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  useEffect(() => {
    geoPoints.forEach(p => {
      if (p.id in hourlyData || loadingIds.has(p.id)) return
      setLoading(prev => new Set(prev).add(p.id))
      fetch(`/api/weather/hourly?lat=${p.lat}&lng=${p.lng}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then((data: HourlyWeather | null) => setHourly(prev => ({ ...prev, [p.id]: data?.daily14 ? data : null })))
        .catch(() => setHourly(prev => ({ ...prev, [p.id]: null })))
        .finally(() => setLoading(prev => { const n = new Set(prev); n.delete(p.id); return n }))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoPoints.map(p => p.id).join(','), hourlyData])

  // Collect date list from first loaded point
  const dates = useMemo(() => {
    const ref = geoPoints.find(p => hourlyData[p.id]?.daily14)
    return hourlyData[ref?.id ?? '']?.daily14?.map(d => d.date) ?? []
  }, [geoPoints, hourlyData])

  // Per-date average score (for the aggregate row) — active points only
  const dayAvgs = useMemo(() => (
    dates.map(date => {
      let sum = 0, count = 0
      activePoints.forEach(p => {
        const day = hourlyData[p.id]?.daily14?.find(d => d.date === date)
        if (!day) return
        sum += calcScore(day.weather_code, day.rain_prob, day.temp_max, day.temp_min, mode, day.wind_speed_max ?? 0)
        count++
      })
      return count > 0 ? Math.round(sum / count) : -1
    })
  ), [dates, activePoints, hourlyData, mode])

  // Top-3 date column indices by average
  const top3Idx = useMemo(() => (
    dayAvgs
      .map((avg, i) => ({ avg, i }))
      .filter(x => x.avg >= 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
      .map(x => x.i)
  ), [dayAvgs])

  const initialLoading = loadingIds.size > 0 && dates.length === 0

  if (geoPoints.length === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--dash-text-4)', fontSize: 14,
      }}>
        座標登録済みのポイントがありません
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--dash-panel-solid)', position: 'relative' }}>
      <style>{`@keyframes bdmShim{0%,100%{opacity:.3}50%{opacity:.65}}`}</style>

      {/* Freeプランロックオーバーレイ */}
      {plan === 'free' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          background: 'var(--dash-panel)',
          backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: 32 }}>🔒</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dash-text)' }}>Best Day機能</div>
          <div style={{ fontSize: 13, color: 'var(--dash-text-3)', textAlign: 'center', lineHeight: 1.7 }}>
            Standardプランで<br/>全ポイントのベストデイを比較できます
          </div>
          <a href="/settings" style={{
            marginTop: 4, padding: '9px 20px', borderRadius: 10,
            background: 'linear-gradient(135deg,#fbbf24,#f97316)',
            color: '#000', fontSize: 13, fontWeight: 800,
            textDecoration: 'none',
          }}>
            ⚡ アップグレード
          </a>
        </div>
      )}

      {/* ── Header bar ── */}
      <div style={{
        flexShrink: 0, height: 42,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: '1px solid var(--dash-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dash-text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🏆 Best Day
          </div>
          {(['sunny', 'rainy'] as ScoreMode[]).map(m => {
            const active = mode === m
            const accent = m === 'sunny' ? '#fbbf24' : '#60a5fa'
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '4px 14px', borderRadius: 20,
                  border: `1px solid ${active ? accent + '99' : 'var(--dash-border-strong)'}`,
                  background: active ? `${accent}18` : 'transparent',
                  color: active ? accent : 'var(--dash-text-4)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: active ? `0 0 10px ${accent}22` : 'none',
                }}
              >
                {m === 'sunny' ? '☀️ 晴れ' : '🌧️ 雨'}
              </button>
            )
          })}
        </div>
        <div />
      </div>

      {/* ── Matrix (scrollable x+y) ── */}
      <div style={{
        flex: 1, overflow: 'auto', scrollbarWidth: 'thin',
        scrollbarColor: 'var(--dash-border-strong) transparent',
      }}>
        {/* Table wrapper — inline-flex so it grows with content */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', minWidth: '100%' }}>

          {/* ─── Column header row ─── */}
          <div style={{
            display: 'flex', alignItems: 'stretch',
            position: 'sticky', top: 0, zIndex: 4,
          }}>
            {/* Corner cell */}
            <div style={{
              width: LABEL_W, flexShrink: 0,
              position: 'sticky', left: 0, zIndex: 5,
              background: 'var(--dash-panel-solid)',
              borderRight: '1px solid var(--dash-border)',
              borderBottom: '1px solid var(--dash-border)',
            }} />

            {/* Date column headers */}
            {dates.map((date, i) => {
              const d = new Date(date + 'T00:00:00')
              const label  = `${d.getMonth() + 1}/${d.getDate()}`
              const dow    = DOW_JP[d.getDay()]
              const isSat  = d.getDay() === 6
              const isSun  = d.getDay() === 0
              const mIdx   = top3Idx.indexOf(i)
              const isMed  = mIdx >= 0
              const mc     = isMed ? MEDAL_COLORS[mIdx] : null

              return (
                <div
                  key={date}
                  style={{
                    width: DATE_W, flexShrink: 0, marginRight: DATE_GAP,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '6px 2px',
                    background: mc?.bg ?? 'var(--dash-panel-solid)',
                    borderBottom: `2px solid ${mc?.border ?? 'var(--dash-surface2)'}`,
                    gap: 1,
                  }}
                >
                  {isMed && <span style={{ fontSize: 13, lineHeight: 1 }}>{MEDALS[mIdx]}</span>}
                  <span style={{
                    fontSize: 13, fontWeight: 800, lineHeight: 1,
                    color: isMed ? mc!.text : (isSun ? '#f87171' : isSat ? '#93c5fd' : 'var(--dash-text-2)'),
                  }}>{label}</span>
                  <span style={{
                    fontSize: 11, lineHeight: 1,
                    color: isSun ? 'rgba(248,113,113,0.6)' : isSat ? 'rgba(147,197,253,0.6)' : 'var(--dash-text-4)',
                  }}>{dow}</span>
                </div>
              )
            })}
          </div>

          {/* ─── Loading shimmer ─── */}
          {initialLoading && (
            Array.from({ length: Math.max(activePoints.length, 2) }).map((_, ri) => (
              <div key={ri} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--dash-surface)' }}>
                <div style={{
                  width: LABEL_W, height: ROW_H, flexShrink: 0,
                  position: 'sticky', left: 0, zIndex: 1,
                  background: 'var(--dash-panel-solid)',
                  borderRight: '1px solid var(--dash-border)',
                  display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--dash-border-strong)', animation: 'bdmShim 1.5s infinite' }} />
                  <div style={{ width: 80, height: 12, borderRadius: 4, background: 'var(--dash-border)', animation: 'bdmShim 1.5s infinite' }} />
                </div>
                {Array.from({ length: 14 }).map((_, ci) => (
                  <div key={ci} style={{ width: DATE_W, height: ROW_H, flexShrink: 0, marginRight: DATE_GAP, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: DATE_W - 8, height: ROW_H - 12, borderRadius: 6, background: 'var(--dash-surface)', animation: 'bdmShim 1.5s infinite', animationDelay: `${ci * 0.04}s` }} />
                  </div>
                ))}
              </div>
            ))
          )}

          {/* ─── Point rows (all geo-points; unchecked rows are dimmed) ─── */}
          {!initialLoading && geoPoints.map(p => {
            const isHL      = p.id === highlightPointId
            const color     = p.color ?? '#60a5fa'
            const isLoading = loadingIds.has(p.id)
            const isOn      = selectedIds.has(p.id)

            return (
              <div
                key={p.id}
                style={{
                  display: 'flex', alignItems: 'center',
                  borderBottom: '1px solid var(--dash-surface)',
                  background: isHL ? 'var(--dash-accent-bg)' : 'transparent',
                }}
              >
                {/* Row label (sticky left) — opacityをここにはかけない */}
                <div style={{
                  width: LABEL_W, height: ROW_H, flexShrink: 0,
                  position: 'sticky', left: 0, zIndex: 1,
                  background: isHL ? 'var(--dash-accent-bg)' : 'var(--dash-panel-solid)',
                  borderRight: '1px solid var(--dash-border)',
                  borderLeft: `2px solid ${isHL ? color : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 7, padding: '0 8px 0 10px',
                }}>
                  {/* Toggle checkbox */}
                  <button
                    onClick={() => togglePoint(p.id)}
                    title={isOn ? '除外する' : '含める'}
                    style={{
                      flexShrink: 0,
                      width: 16, height: 16, borderRadius: 4,
                      border: `1.5px solid ${isOn ? color : 'var(--dash-border-strong)'}`,
                      background: isOn ? color + '33' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, transition: 'all 0.15s',
                    }}
                  >
                    {isOn && (
                      <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1.5,5 4,7.5 8.5,2.5"/>
                      </svg>
                    )}
                  </button>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: color, boxShadow: isOn ? `0 0 5px ${color}` : 'none',
                  }} />
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: isHL ? 'var(--dash-text)' : 'var(--dash-text-2)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1,
                  }}>
                    {p.name}
                  </span>
                </div>

                {/* Score cells — チェックOFFは薄く */}
                {dates.map((date, i) => {
                  const mIdx  = top3Idx.indexOf(i)
                  const isMed = mIdx >= 0
                  const mc    = isMed ? MEDAL_COLORS[mIdx] : null
                  const day   = hourlyData[p.id]?.daily14?.find(d => d.date === date)

                  if (isLoading || !day) {
                    return (
                      <div key={date} style={{
                        width: DATE_W, height: ROW_H, flexShrink: 0, marginRight: DATE_GAP,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: mc?.bg ?? 'transparent',
                        opacity: isOn ? 1 : 0.35,
                      }}>
                        <div style={{
                          width: DATE_W - 10, height: ROW_H - 14, borderRadius: 6,
                          background: 'var(--dash-surface)',
                          animation: isLoading ? 'bdmShim 1.5s infinite' : 'none',
                        }} />
                      </div>
                    )
                  }

                  const icon = WEATHER_ICON[wmoToMain(day.weather_code)] ?? '🌫️'

                  return (
                    <div key={date} style={{
                      width: DATE_W, height: ROW_H, flexShrink: 0, marginRight: DATE_GAP,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      background: mc ? mc.bg : 'transparent',
                      borderLeft:  isMed ? `1px solid ${mc!.border}` : 'none',
                      borderRight: isMed ? `1px solid ${mc!.border}` : 'none',
                      opacity: isOn ? 1 : 0.35,
                      transition: 'opacity 0.15s',
                    }}>
                      <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
                      <span style={{ fontSize: 10, color: 'var(--dash-text-2)', lineHeight: 1, fontWeight: 600 }}>
                        <span style={{ color: '#fca5a5' }}>{day.temp_max}°</span>
                        <span style={{ color: 'var(--dash-text-4)', margin: '0 1px' }}>/</span>
                        <span style={{ color: '#93c5fd' }}>{day.temp_min}°</span>
                      </span>
                      <span style={{ fontSize: 10, lineHeight: 1, color: day.rain_prob >= 50 ? '#93c5fd' : 'var(--dash-text-4)', fontWeight: 600 }}>
                        {day.rain_prob}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* ─── Aggregate row ─── */}
          {!initialLoading && dates.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center',
              borderTop: '2px solid var(--dash-border-strong)',
              background: 'var(--dash-panel-solid)',
              position: 'sticky', bottom: 0, zIndex: 3,
            }}>
              {/* Label */}
              <div style={{
                width: LABEL_W, height: ROW_H + 8, flexShrink: 0,
                position: 'sticky', left: 0, zIndex: 4,
                background: 'var(--dash-panel-solid)',
                borderRight: '1px solid var(--dash-border-strong)',
                borderLeft: '2px solid var(--dash-border-strong)',
                display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--dash-text-2)', letterSpacing: '0.04em' }}>
                  デイスコア
                </span>
              </div>

              {/* Aggregate cells */}
              {dayAvgs.map((avg, i) => {
                const mIdx  = top3Idx.indexOf(i)
                const isMed = mIdx >= 0
                const mc    = isMed ? MEDAL_COLORS[mIdx] : null
                const avgColor = avg >= 0 ? scoreColor(avg) : 'var(--dash-border-strong)'
                function solidScoreBg(s: number): string {
                  if (s >= 80) return 'rgba(62,207,142,0.28)'
                  if (s >= 60) return 'rgba(96,165,250,0.22)'
                  if (s >= 40) return 'rgba(251,191,36,0.22)'
                  return 'rgba(248,113,113,0.18)'
                }
                const avgBg = avg >= 0 ? solidScoreBg(avg) : 'var(--dash-panel-solid)'
                return (
                  <div key={dates[i] ?? i} style={{
                    width: DATE_W, height: ROW_H + 8, flexShrink: 0, marginRight: DATE_GAP,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    background: isMed ? mc!.bg : avgBg,
                    borderLeft:  isMed ? `1px solid ${mc!.border}` : 'none',
                    borderRight: isMed ? `1px solid ${mc!.border}` : 'none',
                    borderTop:   isMed ? `2px solid ${mc!.border}` : '2px solid transparent',
                  }}>
                    {avg >= 0 ? (
                      <>
                        {isMed && <span style={{ fontSize: 13, lineHeight: 1 }}>{MEDALS[mIdx]}</span>}
                        <span style={{
                          fontSize: isMed ? 16 : 15,
                          fontWeight: 900, lineHeight: 1,
                          color: isMed ? mc!.text : avgColor,
                          textShadow: isMed ? `0 0 12px ${mc!.text}88` : `0 0 8px ${avgColor}66`,
                        }}>
                          {avg}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--dash-border-strong)' }}>–</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
