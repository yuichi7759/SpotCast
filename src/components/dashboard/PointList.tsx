'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import type { Field, WeatherData } from '@/types/field'

const ORDER_KEY = 'spotcast:spotOrder'

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
  dragging,
  dragOver,
  onGripDragStart,
  onCardDragOver,
  onCardDrop,
  onDragEnd,
}: {
  point: Field
  selected: boolean
  onPointClick: () => void
  onPointEdit: () => void
  dragging: boolean
  dragOver: boolean
  onGripDragStart: (e: React.DragEvent) => void
  onCardDragOver: (e: React.DragEvent) => void
  onCardDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
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
      onDragOver={onCardDragOver}
      onDrop={onCardDrop}
      onDragEnd={onDragEnd}
      style={{
        position: 'relative',
        padding: '12px 10px 12px 6px',
        borderRadius: 10,
        background: selected ? 'var(--dash-accent-bg)' : 'var(--dash-surface)',
        border: '1px solid var(--dash-border)',
        borderTop: dragOver ? '2px solid var(--dash-accent)' : '1px solid var(--dash-border)',
        borderLeft: selected ? `3px solid ${accentColor}` : '3px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.15s',
        opacity: dragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
      onMouseEnter={e => {
        if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'var(--dash-surface2)'
      }}
      onMouseLeave={e => {
        if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'var(--dash-surface)'
      }}
    >
      {/* Drag grip */}
      <span
        draggable
        onDragStart={onGripDragStart}
        onClick={e => e.stopPropagation()}
        title="ドラッグして並べ替え"
        style={{
          flexShrink: 0, cursor: 'grab', color: 'var(--dash-text-4)',
          display: 'flex', alignItems: 'center', padding: '0 1px',
          touchAction: 'none',
        }}
      >
        <svg viewBox="0 0 10 16" width="10" height="16" fill="currentColor">
          <circle cx="3" cy="3" r="1.3"/><circle cx="7" cy="3" r="1.3"/>
          <circle cx="3" cy="8" r="1.3"/><circle cx="7" cy="8" r="1.3"/>
          <circle cx="3" cy="13" r="1.3"/><circle cx="7" cy="13" r="1.3"/>
        </svg>
      </span>

      {/* Color dot */}
      <div style={{
        width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
        background: accentColor,
        boxShadow: `0 0 6px ${accentColor}99`,
      }} />

      {/* Name + location */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 700, color: 'var(--dash-text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {point.name}
        </div>
        {!hasCoords && (
          <div style={{ fontSize: 12, color: 'var(--dash-text-4)', marginTop: 2 }}>
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
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--dash-text)' }}>{weather.current.temp}°</span>
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
          color: 'var(--dash-text-4)',
          fontSize: 18, lineHeight: 1,
          padding: '2px 4px', borderRadius: 6,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--dash-text-2)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--dash-text-4)' }}
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
  // 保存済みの並び順（localStorage）
  const [orderIds, setOrderIds] = useState<string[]>([])
  const [dragId,   setDragId]   = useState<string | null>(null)
  const [overId,   setOverId]   = useState<string | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ORDER_KEY)
      if (raw) setOrderIds(JSON.parse(raw))
    } catch {}
    loadedRef.current = true
  }, [])

  function persist(ids: string[]) {
    setOrderIds(ids)
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(ids)) } catch {}
  }

  // 保存順に従って並べ替え。未知のID（新規）は末尾に元の順で残す。
  const rank = new Map(orderIds.map((id, i) => [id, i]))
  const ordered = [...points].sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id)! : Infinity
    const rb = rank.has(b.id) ? rank.get(b.id)! : Infinity
    if (ra !== rb) return ra - rb
    return 0  // 未知同士は元の順を維持（安定ソート）
  })

  function reorder(srcId: string, targetId: string) {
    if (srcId === targetId) return
    const ids = ordered.map(p => p.id)
    const from = ids.indexOf(srcId)
    const to   = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(from, 1)
    ids.splice(to, 0, srcId)
    persist(ids)
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--dash-panel)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 12px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--dash-surface2)',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dash-text)', letterSpacing: '-0.01em' }}>
          My Spots
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link
          href="/settings"
          title="設定"
          style={{
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--dash-surface)',
            border: '1px solid var(--dash-border-strong)',
            color: 'var(--dash-text-3)',
            transition: 'all 0.15s',
            textDecoration: 'none',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.color = 'var(--dash-text)'; el.style.borderColor = 'var(--dash-border-strong)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.color = 'var(--dash-text-3)'; el.style.borderColor = 'var(--dash-border-strong)'
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
            background: 'var(--dash-accent-bg)',
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
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--dash-accent-bg)'
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
            color: 'var(--dash-border-strong)',
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            まだポイントがありません。<br />
            「＋」ボタンで追加しましょう。
          </div>
        ) : (
          ordered.map(p => (
            <PointCard
              key={p.id}
              point={p}
              selected={p.id === selectedPointId}
              onPointClick={() => onPointClick(p)}
              onPointEdit={() => onPointEdit(p)}
              dragging={dragId === p.id}
              dragOver={overId === p.id && dragId !== p.id}
              onGripDragStart={e => {
                setDragId(p.id)
                e.dataTransfer.effectAllowed = 'move'
                try { e.dataTransfer.setData('text/plain', p.id) } catch {}
              }}
              onCardDragOver={e => {
                if (!dragId) return
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (overId !== p.id) setOverId(p.id)
              }}
              onCardDrop={e => {
                e.preventDefault()
                if (dragId) reorder(dragId, p.id)
                setDragId(null); setOverId(null)
              }}
              onDragEnd={() => { setDragId(null); setOverId(null) }}
            />
          ))
        )}
      </div>
    </div>
  )
}
