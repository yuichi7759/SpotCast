'use client'
import { useEffect, useState } from 'react'
import type { Field, WeatherData } from '@/types/field'

interface PointWeather {
  field: Field
  data: WeatherData | null
  loading: boolean
}

interface Props {
  points: Field[]
}

const WEATHER_ICON: Record<string, string> = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️',
}
function weatherIcon(main: string): string {
  return WEATHER_ICON[main] ?? '🌫️'
}

interface HighlightChip {
  icon: string
  text: string
  key: string
}

export default function PointsSummaryPanel({ points }: Props) {
  const [pointWeathers, setPointWeathers] = useState<PointWeather[]>([])

  // Initialize pointWeathers when points change
  useEffect(() => {
    setPointWeathers(
      points.map(field => ({ field, data: null, loading: field.lat != null && field.lng != null }))
    )
  }, [points.map(p => p.id).join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch weather for each point with coords
  useEffect(() => {
    const withCoords = points.filter(f => f.lat != null && f.lng != null)
    if (withCoords.length === 0) return

    withCoords.forEach(field => {
      fetch(`/api/weather?lat=${field.lat}&lng=${field.lng}`, { cache: 'no-store' })
        .then(r => r.json())
        .then((data: WeatherData) => {
          setPointWeathers(prev =>
            prev.map(pw => pw.field.id === field.id ? { ...pw, data, loading: false } : pw)
          )
        })
        .catch(() => {
          setPointWeathers(prev =>
            prev.map(pw => pw.field.id === field.id ? { ...pw, loading: false } : pw)
          )
        })
    })
  }, [points.map(p => p.id).join(','), points.map(p => `${p.lat},${p.lng}`).join('|')])  // eslint-disable-line react-hooks/exhaustive-deps

  // Compute highlights from fetched data
  const loaded = pointWeathers.filter(pw => pw.data != null)

  const highlights: HighlightChip[] = []

  if (loaded.length > 0) {
    // 1. Highest temp
    const hottest = loaded.reduce((a, b) =>
      (b.data!.current.temp > a.data!.current.temp ? b : a)
    )
    highlights.push({
      key: 'temp',
      icon: '🌡️',
      text: `最高気温: ${hottest.field.name} ${hottest.data!.current.temp}°`,
    })

    // 2. Rain warning (humidity > 80%)
    const highHumidity = loaded.reduce((a, b) =>
      (b.data!.current.humidity > a.data!.current.humidity ? b : a)
    )
    if (highHumidity.data!.current.humidity > 80) {
      highlights.push({
        key: 'rain',
        icon: '💧',
        text: `降水リスク: ${highHumidity.field.name} 湿度${highHumidity.data!.current.humidity}%`,
      })
    }

    // 3. Wind warning (wind_speed > 7 m/s)
    const windiest = loaded.reduce((a, b) =>
      (b.data!.current.wind_speed > a.data!.current.wind_speed ? b : a)
    )
    if (windiest.data!.current.wind_speed > 7) {
      highlights.push({
        key: 'wind',
        icon: '💨',
        text: `強風注意: ${windiest.field.name} ${windiest.data!.current.wind_speed}m/s`,
      })
    }
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(8,12,18,0.94)',
      overflowY: 'auto',
      scrollbarWidth: 'none',
    }}>
      <style>{`
        @keyframes pspShim { 0%, 100% { opacity: .3 } 50% { opacity: .65 } }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 13, fontWeight: 800,
          color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}>
          📡 現在の状況
        </div>
      </div>

      <div style={{
        flex: 1,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}>

        {/* Section B: Highlights */}
        {highlights.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {highlights.map(chip => (
              <div key={chip.key} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 20,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 12, color: 'rgba(255,255,255,0.65)',
                whiteSpace: 'nowrap',
              }}>
                {chip.icon} {chip.text}
              </div>
            ))}
          </div>
        )}

        {/* Section A: Point cards */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}>
            登録ポイント
          </div>

          {points.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '32px 16px',
              color: 'rgba(255,255,255,0.3)',
              fontSize: 14, textAlign: 'center', lineHeight: 1.7,
            }}>
              ポイントを追加してください
            </div>
          ) : (
            pointWeathers.map(({ field, data, loading }) => {
              const dotColor = field.color ?? '#3ecf8e'
              return (
                <div key={field.id} style={{
                  display: 'flex', alignItems: 'center',
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 6, gap: 10,
                }}>
                  {/* Color dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: dotColor,
                    boxShadow: `0 0 5px ${dotColor}`,
                    flexShrink: 0,
                  }} />

                  {/* Name */}
                  <div style={{
                    flex: 1, fontSize: 14, fontWeight: 700,
                    color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {field.name}
                  </div>

                  {/* Weather or loading or no coords */}
                  {field.lat == null || field.lng == null ? (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>未設定</span>
                  ) : loading ? (
                    <div style={{
                      width: 80, height: 32, borderRadius: 6,
                      background: 'rgba(255,255,255,0.07)',
                      animation: 'pspShim 1.5s infinite',
                      flexShrink: 0,
                    }} />
                  ) : data ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 20 }}>{weatherIcon(data.current.weather_main)}</span>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{data.current.temp}°</span>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                        <div>💧{data.current.humidity}%</div>
                        <div>💨{data.current.wind_speed}m/s</div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>取得不可</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
