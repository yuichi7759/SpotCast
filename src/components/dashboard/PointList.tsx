'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Field, WeatherData } from '@/types/field'

interface Props {
  points: Field[]
  selectedPointId?: string | null
  onPointClick: (p: Field) => void
  onPointEdit: (p: Field) => void
  onAdd: () => void
}

const WEATHER_ICON: Record<string, string> = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
}
function weatherIcon(main: string): string {
  return WEATHER_ICON[main] ?? '🌫️'
}

function PointCard({
  point,
  selected,
  onPointClick,
  onPointEdit,
}: {
  point: Field
  selected: boolean
  onPointClick: () => void
  onPointEdit: () => void
}) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const accentColor = point.color ?? '#60a5fa'
  const hasCoords = point.lat != null && point.lng != null

  useEffect(() => {
    if (!hasCoords) return
    fetch(`/api/weather?lat=${point.lat}&lng=${point.lng}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(setWeather)
      .catch(() => {})
  }, [point.lat, point.lng, hasCoords])

  return (
    <div
      onClick={onPointClick}
      style={{
        position: 'relative',
        padding: '12px 10px 12px 14px',
        borderRadius: 10,
        background: selected ? 'rgba(29,78,216,0.08)' : 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: selected ? `3px solid ${accentColor}` : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
      onMouseEnter={e => {
        if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={e => {
        if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
      }}
    >
      {/* Color dot */}
      <div style={{
        width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
        background: accentColor,
        boxShadow: `0 0 6px ${accentColor}99`,
      }} />

      {/* Name + location */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 700, color: '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {point.name}
        </div>
        {!hasCoords && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            📍 地点未設定
          </div>
        )}
      </div>

      {/* Weather mini */}
      {hasCoords && weather && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          flexShrink: 0, gap: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 16 }}>{weatherIcon(weather.current.weather_main)}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{weather.current.temp}°</span>
          </div>
        </div>
      )}

      {/* Edit button (…) */}
      <button
        onClick={e => { e.stopPropagation(); onPointEdit() }}
        style={{
          flexShrink: 0,
          background: 'none', border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 18, lineHeight: 1,
          padding: '2px 4px', borderRadius: 6,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)' }}
        title="編集"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/>
        </svg>
      </button>
    </div>
  )
}

export default function PointList({ points, selectedPointId, onPointClick, onPointEdit, onAdd }: Props) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(6,10,16,0.92)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 12px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
          My Places
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link
          href="/settings"
          title="設定"
          style={{
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)',
            transition: 'all 0.15s',
            textDecoration: 'none',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.color = '#fff'; el.style.borderColor = 'rgba(255,255,255,0.25)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.color = 'rgba(255,255,255,0.4)'; el.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="2"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
          </svg>
        </Link>
        <button
          onClick={onAdd}
          style={{
            width: 30, height: 30,
            borderRadius: 8,
            background: 'rgba(29,78,216,0.15)',
            border: '1px solid rgba(29,78,216,0.35)',
            color: '#60a5fa',
            fontSize: 20, lineHeight: '1',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(29,78,216,0.28)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(29,78,216,0.15)'
          }}
          title="ポイントを追加"
        >
          ＋
        </button>
        </div>
      </div>

      {/* Point list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 6,
        scrollbarWidth: 'none',
      }}>
        {points.length === 0 ? (
          <div style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.25)',
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            まだポイントがありません。<br />
            「＋」ボタンで追加しましょう。
          </div>
        ) : (
          points.map(p => (
            <PointCard
              key={p.id}
              point={p}
              selected={p.id === selectedPointId}
              onPointClick={() => onPointClick(p)}
              onPointEdit={() => onPointEdit(p)}
            />
          ))
        )}
      </div>
    </div>
  )
}
