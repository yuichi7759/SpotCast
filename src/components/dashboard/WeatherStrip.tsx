'use client'
import { useEffect, useState } from 'react'
import type { Field, WeatherData } from '@/types/field'

interface Props {
  fields: Field[]
  selectedFieldId?: string | null
  onFieldClick?: (field: Field) => void
}

const ICON: Record<string, string> = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️',
}
const LABEL: Record<string, string> = {
  Clear: '快晴', Clouds: '曇り', Rain: '雨', Drizzle: '小雨',
  Thunderstorm: '雷雨', Snow: '雪', Mist: '霧', Fog: '濃霧', Haze: 'もや',
}
const DOW = ['日', '月', '火', '水', '木', '金', '土']

function dayInfo(dateStr: string): { label: string; date: string } {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  const date = `${d.getMonth() + 1}/${d.getDate()}`
  if (diff === 1) return { label: '明日', date }
  if (diff === 2) return { label: '明後', date }
  return { label: DOW[d.getDay()], date }
}

function rainColor(prob: number): string {
  if (prob >= 60) return '#60a5fa'
  if (prob >= 30) return '#fbbf24'
  return '#f87171'
}

function WeatherMiniCard({ field, selected, onClick }: { field: Field; selected?: boolean; onClick?: () => void }) {
  const [w, setW] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (field.lat == null || field.lng == null) return
    fetch(`/api/weather?lat=${field.lat}&lng=${field.lng}`, { cache: 'no-store' })
      .then(r => r.json()).then(setW).catch(() => {})
      .finally(() => setLoading(false))
  }, [field.lat, field.lng])

  const accentColor = field.color ?? '#3ecf8e'

  return (
    <div
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: loading ? 260 : (w?.forecast.length ?? 0) > 0 ? 'auto' : 260,
        minWidth: 260,
        background: selected ? `${accentColor}12` : 'rgba(8,12,18,0.88)',
        border: `1px solid ${selected ? accentColor + '88' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: selected ? `0 0 18px ${accentColor}33` : 'none',
        borderRadius: 14,
        padding: '12px 14px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={e => { if (onClick && !selected) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
      onMouseLeave={e => { if (onClick && !selected) (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
    >
      {/* ── 地点名 ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: accentColor, boxShadow: `0 0 6px ${accentColor}99`,
        }}/>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {field.name}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 8 }}>
          {[40, 60, 80, 50, 60, 40, 50].map((w, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
              {[w * 0.6, w, w * 0.8, w * 0.7, w * 0.5].map((sw, j) => (
                <div key={j} style={{
                  height: 8, width: sw * 0.4, borderRadius: 4,
                  background: 'rgba(255,255,255,0.07)',
                  animation: 'shimW 1.5s infinite',
                  animationDelay: `${i * 0.1}s`,
                }}/>
              ))}
            </div>
          ))}
          <style>{`@keyframes shimW{0%,100%{opacity:.3}50%{opacity:.7}}`}</style>
        </div>
      ) : !w ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>取得できません</div>
      ) : (
        <div style={{ display: 'flex', gap: 0 }}>

          {/* ── 現在の天気（左列） ── */}
          <div style={{
            flexShrink: 0, width: 120,
            paddingRight: 12,
            borderRight: '1px solid rgba(255,255,255,0.07)',
            marginRight: 12,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            {/* 気温 + アイコン */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1 }}>
                  {w.current.temp}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>°C</span>
              </div>
              <div style={{ textAlign: 'right', marginTop: 2 }}>
                <div style={{ fontSize: 22, lineHeight: 1 }}>{ICON[w.current.weather_main] ?? '🌡️'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, whiteSpace: 'nowrap' }}>
                  {LABEL[w.current.weather_main] ?? w.current.weather_main}
                </div>
              </div>
            </div>

            {/* 湿度・風速 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>💧{w.current.humidity}%</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>💨{w.current.wind_speed}m/s</span>
            </div>
          </div>

          {/* ── 週間予報（横カラム） ── */}
          {w.forecast.length > 0 && (
            <div style={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
              {w.forecast.map(day => {
                const { label, date } = dayInfo(day.date)
                const rc = rainColor(day.rain_prob)
                return (
                  <div key={day.date} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 3, width: 42, padding: '2px 0',
                  }}>
                    {/* 曜日 */}
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1 }}>
                      {label}
                    </span>
                    {/* 日付 */}
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1 }}>
                      {date}
                    </span>
                    {/* 天気アイコン */}
                    <span style={{ fontSize: 18, lineHeight: 1 }}>
                      {ICON[day.weather_main] ?? '🌡️'}
                    </span>
                    {/* 最高気温 */}
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                      {Math.round(day.temp_max)}°
                    </span>
                    {/* 最低気温 */}
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
                      {Math.round(day.temp_min)}°
                    </span>
                    {/* 降水確率 */}
                    <span style={{ fontSize: 12, fontWeight: 600, color: rc, lineHeight: 1 }}>
                      {day.rain_prob}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WeatherStrip({ fields, selectedFieldId, onFieldClick }: Props) {
  const [open, setOpen] = useState(true)

  const geoFields = fields.filter(f => f.lat != null && f.lng != null)

  if (geoFields.length === 0) return null

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      zIndex: 15, pointerEvents: 'none',
    }}>
      {/* Toggle tab */}
      <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}>
        <button
          onClick={() => setOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 18px',
            background: 'rgba(8,12,18,0.88)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderBottom: open ? 'none' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: open ? '10px 10px 0 0' : 10,
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 13, fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M2 4l4 4 4-4"/> : <path d="M2 8l4-4 4 4"/>}
          </svg>
          登録地点の天気
          <span style={{
            fontSize: 12, fontWeight: 700,
            background: 'rgba(62,207,142,0.15)',
            color: '#3ecf8e',
            borderRadius: 6, padding: '1px 7px',
          }}>{geoFields.length}地点</span>
        </button>
      </div>

      {/* Strip */}
      {open && (
        <div style={{
          background: 'rgba(4,7,12,0.88)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '12px 16px',
          pointerEvents: 'auto',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          <div style={{ display: 'flex', gap: 10, width: 'max-content' }}>
            {geoFields.map(field => (
              <WeatherMiniCard
                key={field.id}
                field={field}
                selected={field.id === selectedFieldId}
                onClick={onFieldClick ? () => onFieldClick(field) : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
