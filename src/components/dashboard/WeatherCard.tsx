'use client'
import { useEffect, useState } from 'react'
import type { WeatherData } from '@/types/field'

interface Props { lat: number; lng: number }

const WEATHER_JP: Record<string, string> = {
  Clear: '快晴', Clouds: '曇り', Rain: '雨', Drizzle: '小雨',
  Thunderstorm: '雷雨', Snow: '雪', Mist: '霧', Fog: '濃霧',
  Haze: 'もや', Dust: '砂埃', Sand: '砂嵐', Smoke: '煙霧',
}
const WEATHER_ICON: Record<string, string> = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️',
  Haze: '🌫️', Dust: '💨', Sand: '💨', Smoke: '💨',
}
const jpW = (w: string) => WEATHER_JP[w] ?? w
const iconFor = (w: string) => WEATHER_ICON[w] ?? '🌡️'

export default function WeatherCard({ lat, lng }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      .then(r => r.json()).then(setWeather).catch(() => {})
      .finally(() => setLoading(false))
  }, [lat, lng])

  const glass: React.CSSProperties = {
    background: 'rgba(8,12,18,0.78)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    color: '#f0f0f0',
    width: 230,
    overflow: 'hidden',
  }

  if (loading) return (
    <div style={glass}>
      <style>{`@keyframes shimmerDark{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[80, 130, 90].map((w, i) => (
          <div key={i} style={{
            height: 12, borderRadius: 6, width: w,
            background: 'linear-gradient(90deg,rgba(255,255,255,.06) 25%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.06) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmerDark 1.5s infinite',
          }}/>
        ))}
      </div>
    </div>
  )

  if (!weather) return null

  const sprayOk = weather.current.wind_speed < 3 && (weather.forecast[0]?.rain_prob ?? 0) < 30

  return (
    <div style={glass}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          📍 {weather.city}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: '#fff', letterSpacing: '-2px' }}>
                {weather.current.temp}
              </span>
              <span style={{ fontSize: 18, fontWeight: 300, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>°C</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {jpW(weather.current.weather_main)}
            </div>
          </div>
          <div style={{ fontSize: 44, lineHeight: 1 }}>{iconFor(weather.current.weather_main)}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: '体感温度', value: `${weather.current.feels_like}°`, icon: '🌡' },
          { label: '湿度', value: `${weather.current.humidity}%`, icon: '💧' },
          { label: '風速', value: `${weather.current.wind_speed}m/s`, icon: '💨' },
          { label: '明日降水', value: `${weather.forecast[0]?.rain_prob ?? '--'}%`, icon: '🌧' },
        ].map(({ label, value, icon }, i) => (
          <div key={label} style={{
            padding: '10px 14px',
            borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>{icon} {label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Spray indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 14px',
        background: sprayOk ? 'rgba(29,78,216,0.08)' : 'rgba(251,146,60,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: sprayOk ? '#60a5fa' : '#f59e0b',
          boxShadow: sprayOk ? '0 0 8px rgba(29,78,216,0.9)' : '0 0 8px rgba(245,158,11,0.9)',
        }}/>
        <div style={{ fontSize: 11, fontWeight: 700, color: sprayOk ? '#60a5fa' : '#f59e0b' }}>
          外出 {sprayOk ? 'OK' : '注意'}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
          {sprayOk ? '条件良好' : '要確認'}
        </div>
      </div>

      {/* 3-day forecast */}
      <div style={{ display: 'flex', padding: '10px 10px', gap: 6 }}>
        {weather.forecast.map(day => (
          <div key={day.date} style={{
            flex: 1, textAlign: 'center',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10, padding: '8px 4px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
              {new Date(day.date).toLocaleDateString('ja-JP', { weekday: 'short' })}
            </div>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{iconFor(day.weather_main)}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ff7c7c' }}>{day.temp_max}°</div>
            <div style={{ fontSize: 11, color: '#7cb8ff' }}>{day.temp_min}°</div>
            <div style={{ fontSize: 9, color: '#7cb8ff', marginTop: 2, opacity: 0.7 }}>{day.rain_prob}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
