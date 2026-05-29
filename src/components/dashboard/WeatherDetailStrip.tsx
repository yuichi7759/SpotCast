'use client'
import { useEffect, useState } from 'react'
import type { Field, WeatherData } from '@/types/field'
import type { HourlyWeather } from '@/app/api/weather/hourly/route'

const WEATHER_ICON: Record<string, string> = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️',
}
function weatherIcon(main: string) { return WEATHER_ICON[main] ?? '🌫️' }

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

function rainColor(p: number) {
  if (p >= 60) return '#60a5fa'
  if (p >= 30) return '#fbbf24'
  return 'rgba(255,255,255,0.35)'
}

interface Props {
  field: Field
  onClose?: () => void
}

export default function WeatherDetailStrip({ field, onClose }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [hourly,  setHourly]  = useState<HourlyWeather | null>(null)
  const [loading, setLoading] = useState(false)

  const accentColor = field.color ?? '#3ecf8e'
  const hasCoords   = field.lat != null && field.lng != null

  useEffect(() => {
    if (!hasCoords) return
    setLoading(true)
    setWeather(null); setHourly(null)

    Promise.all([
      fetch(`/api/weather?lat=${field.lat}&lng=${field.lng}`, { cache: 'no-store' })
        .then(r => r.json()).then(setWeather).catch(() => {}),
      fetch(`/api/weather/hourly?lat=${field.lat}&lng=${field.lng}`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null).then(d => { if (d?.hourly) setHourly(d) }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [field.id, field.lat, field.lng, hasCoords])

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'stretch',
      background: 'rgba(5,8,14,0.98)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      overflow: 'hidden',
    }}>
      <style>{`@keyframes wdsShim{0%,100%{opacity:.3}50%{opacity:.65}}`}</style>

      {/* ── Left: field name + current conditions ── */}
      <div style={{
        flexShrink: 0, width: 240,
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '10px 16px', gap: 6,
      }}>
        {/* Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: accentColor, boxShadow: `0 0 6px ${accentColor}`,
          }} />
          <span style={{
            fontSize: 15, fontWeight: 800, color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {field.name}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                marginLeft: 'auto', flexShrink: 0,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', lineHeight: 0, padding: 2,
              }}
            >
              <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/>
              </svg>
            </button>
          )}
        </div>

        {/* Current conditions */}
        {!hasCoords ? (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>📍 地点未設定</span>
        ) : loading ? (
          <div style={{ display: 'flex', gap: 6 }}>
            {[60, 48, 56].map((w, i) => (
              <div key={i} style={{ width: w, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.07)', animation: 'wdsShim 1.5s infinite' }} />
            ))}
          </div>
        ) : weather ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
              <span style={{ fontSize: 26, lineHeight: 1 }}>{weatherIcon(weather.current.weather_main)}</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{weather.current.temp}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>°C</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>💧 {weather.current.humidity}%　💨 {weather.current.wind_speed}m/s</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>体感 {weather.current.feels_like}°C</span>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>取得できません</span>
        )}
      </div>

      {/* ── Right: today's hourly forecast (horizontal scroll) ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        overflowX: 'auto', overflowY: 'hidden',
        padding: '0 12px', gap: 4,
        scrollbarWidth: 'none',
      }}>
        {/* Section label */}
        <div style={{ flexShrink: 0, marginRight: 8, paddingRight: 12, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            今日の天気
          </span>
        </div>

        {!hasCoords ? null
          : loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: 50, height: 80, borderRadius: 8, background: 'rgba(255,255,255,0.05)', animation: 'wdsShim 1.5s infinite', animationDelay: `${i * 0.05}s` }} />
            ))
          ) : hourly && hourly.hourly && hourly.hourly.length > 0 ? (
            hourly.hourly.slice(0, 24).map((h, i) => {
              const isGood = h.wind_speed < 3 && h.rain_prob < 30
              const isMid  = !isGood && h.wind_speed < 5 && h.rain_prob < 60
              const bg = isGood ? 'rgba(62,207,142,0.09)' : isMid ? 'rgba(245,158,11,0.07)' : 'transparent'
              const timeLabel = h.time.replace(':00', '時').replace(/^0/, '')
              const prevH = i > 0 ? hourly.hourly[i - 1] : null
              const prevHour = prevH ? parseInt(prevH.time.split(':')[0], 10) : null
              const currHour = parseInt(h.time.split(':')[0], 10)
              const isDayBoundary = prevHour !== null && currHour < prevHour
              return (
                <div key={i} style={{ display: 'contents' }}>
                  {isDayBoundary && (
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 36, gap: 2 }}>
                      <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.15)' }} />
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, whiteSpace: 'nowrap' }}>明日</span>
                      <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.15)' }} />
                    </div>
                  )}
                  <div style={{
                    flexShrink: 0, width: 50,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 2, padding: '5px 2px', borderRadius: 8, background: bg,
                  }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{timeLabel}</span>
                    <span style={{ fontSize: 18 }}>{weatherIcon(wmoToMain(h.weather_code))}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{h.temp}°</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: rainColor(h.rain_prob) }}>{h.rain_prob}%</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{h.wind_speed}m</span>
                  </div>
                </div>
              )
            })
          ) : (
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>取得できません</span>
          )
        }
      </div>
    </div>
  )
}
