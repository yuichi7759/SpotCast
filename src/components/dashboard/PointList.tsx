'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import type { Field, WeatherData } from '@/types/field'
import { applyOrder } from '@/lib/spotOrder'
import { useT } from '@/components/LocaleProvider'

interface Props {
  points: Field[]
  selectedPointId?: string | null
  onPointClick: (p: Field) => void
  onPointEdit: (p: Field) => void
  onAdd: () => void
  orderIds: string[]
  onReorder: (ids: string[]) => void
  hideHeader?: boolean   // モバイル: 上のタブ/ピーク表示と重複するヘッダーを省く
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
  const cardRef = useRef<HTMLDivElement>(null)
  const t = useT()
  const accentColor = point.color ?? '#60a5fa'
  const hasCoords = point.lat != null && point.lng != null

  useEffect(() => {
    if (!hasCoords) return
    fetch(`/api/weather?lat=${point.lat}&lng=${point.lng}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d && d.current) setWeather(d) })   // エラー応答({error})は無視
      .catch(() => {})
  }, [point.lat, point.lng, hasCoords])

  return (
    <div
      ref={cardRef}
      onClick={onPointClick}
      onDragOver={onCardDragOver}
      onDrop={onCardDrop}
      onDragEnd={onDragEnd}
      style={{
        position: 'relative',
        padding: '12px 10px 12px 6px',
        borderRadius: 10,
        background: dragOver ? 'var(--dash-accent-bg)' : selected ? 'var(--dash-accent-bg)' : 'var(--dash-surface)',
        border: '1px solid var(--dash-border)',
        borderTop: dragOver ? '2px solid var(--dash-accent)' : '1px solid var(--dash-border)',
        borderLeft: selected ? `3px solid ${accentColor}` : '3px solid transparent',
        cursor: dragging ? 'grabbing' : 'pointer',
        transition: dragging ? 'none' : 'background 0.15s, transform 0.12s',
        opacity: dragging ? 0.35 : 1,
        transform: dragOver ? 'scale(1.015)' : 'none',
        boxShadow: dragOver ? '0 4px 16px rgba(0,0,0,0.25)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
      onMouseEnter={e => {
        if (!selected && !dragOver) (e.currentTarget as HTMLDivElement).style.background = 'var(--dash-surface2)'
      }}
      onMouseLeave={e => {
        if (!selected && !dragOver) (e.currentTarget as HTMLDivElement).style.background = 'var(--dash-surface)'
      }}
    >
      {/* Drag grip */}
      <span
        draggable
        onDragStart={e => {
          // カード全体をドラッグゴーストにして「掴んでる感」を出す
          if (cardRef.current) {
            const r = cardRef.current.getBoundingClientRect()
            try { e.dataTransfer.setDragImage(cardRef.current, e.clientX - r.left, e.clientY - r.top) } catch {}
          }
          onGripDragStart(e)
        }}
        onClick={e => e.stopPropagation()}
        title={t('dash.dragReorder')}
        style={{
          flexShrink: 0, cursor: dragging ? 'grabbing' : 'grab',
          color: dragging ? 'var(--dash-accent)' : 'var(--dash-text-4)',
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
            📍 {t("dash.noLocation")}
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
        title={t('dash.edit')}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/>
        </svg>
      </button>
    </div>
  )
}

export default function PointList({ points, selectedPointId, onPointClick, onPointEdit, onAdd, orderIds, onReorder, hideHeader = false }: Props) {
  const t = useT()
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const ordered = applyOrder(points, orderIds)

  function reorder(srcId: string, targetId: string) {
    if (srcId === targetId) return
    const ids = ordered.map(p => p.id)
    const from = ids.indexOf(srcId)
    const to   = ids.indexOf(targetId)
    if (from < 0 || to < 0) return
    ids.splice(from, 1)
    ids.splice(to, 0, srcId)
    onReorder(ids)
  }

  // ドラッグ中は body のカーソルを grabbing に
  useEffect(() => {
    if (dragId) {
      document.body.style.cursor = 'grabbing'
      return () => { document.body.style.cursor = '' }
    }
  }, [dragId])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--dash-panel)',
    }}>
      {/* Header (モバイルでは上のタブと重複するため非表示) */}
      {!hideHeader && (
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
          title={t('settings.title')}
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
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
          title={t('dash.addPoint')}
        >
          ＋
        </button>
        </div>
      </div>
      )}

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
            {t("dash.emptyTitle")}<br />
            {t("dash.emptyHint")}
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
