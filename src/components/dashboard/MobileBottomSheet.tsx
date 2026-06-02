'use client'
import { useRef, useState, useEffect, ReactNode, useCallback } from 'react'

export type SheetSnap = 'peek' | 'list' | 'detail'

interface Props {
  snap: SheetSnap
  onSnapChange: (s: SheetSnap) => void
  peekContent: ReactNode
  children: ReactNode
}

function getSnapPx(s: SheetSnap): number {
  if (typeof window === 'undefined') return 72
  const vh = window.innerHeight
  if (s === 'peek')   return 72
  if (s === 'list')   return Math.round(vh * 0.46)
  return Math.round(vh * 0.86)
}

function nearestSnap(h: number): SheetSnap {
  const snaps: [SheetSnap, number][] = [
    ['peek',   getSnapPx('peek')],
    ['list',   getSnapPx('list')],
    ['detail', getSnapPx('detail')],
  ]
  return snaps.reduce((best, cur) =>
    Math.abs(cur[1] - h) < Math.abs(getSnapPx(best) - h) ? cur[0] : best
  , 'peek' as SheetSnap)
}

export default function MobileBottomSheet({ snap, onSnapChange, peekContent, children }: Props) {
  const [height, setHeight]       = useState(() => getSnapPx(snap))
  const [dragging, setDragging]   = useState(false)
  const [transitioning, setTrans] = useState(false)
  const startY   = useRef(0)
  const startH   = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Sync snap → height with transition
  useEffect(() => {
    if (dragging) return
    const target = getSnapPx(snap)
    setTrans(true)
    setHeight(target)
    const t = setTimeout(() => setTrans(false), 320)
    return () => clearTimeout(t)
  }, [snap, dragging])

  const beginDrag = useCallback((clientY: number) => {
    setDragging(true)
    setTrans(false)
    startY.current = clientY
    startH.current = height
  }, [height])

  const moveDrag = useCallback((clientY: number) => {
    if (!dragging) return
    const delta = startY.current - clientY
    const next = Math.max(56, Math.min(window.innerHeight * 0.92, startH.current + delta))
    setHeight(next)
  }, [dragging])

  const endDrag = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    const s = nearestSnap(height)
    onSnapChange(s)
    setTrans(true)
    setHeight(getSnapPx(s))
    setTimeout(() => setTrans(false), 320)
  }, [dragging, height, onSnapChange])

  // Global mouse/touch listeners
  useEffect(() => {
    if (!dragging) return
    const onMove  = (e: MouseEvent | TouchEvent) => moveDrag('touches' in e ? e.touches[0].clientY : e.clientY)
    const onEnd   = () => endDrag()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onEnd)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend',  onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend',  onEnd)
    }
  }, [dragging, moveDrag, endDrag])

  const isPeek = snap === 'peek' && !dragging

  return (
    <div
      ref={sheetRef}
      style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height,
        maxHeight: '92vh',
        background: 'var(--dash-panel)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--dash-border)',
        borderRadius: '22px 22px 0 0',
        transition: transitioning ? 'height 0.32s cubic-bezier(0.32,0.72,0,1)' : 'none',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* ── Drag handle ── */}
      <div
        style={{
          flexShrink: 0,
          padding: '10px 0 6px',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onMouseDown={e => beginDrag(e.clientY)}
        onTouchStart={e => beginDrag(e.touches[0].clientY)}
      >
        <div style={{
          width: 38, height: 4, borderRadius: 2,
          background: 'var(--dash-border-strong)',
          margin: '0 auto',
        }}/>
      </div>

      {/* ── Peek content (always visible) ── */}
      <div
        style={{
          flexShrink: 0,
          padding: '2px 16px 8px',
          cursor: isPeek ? 'pointer' : 'default',
        }}
        onClick={() => { if (isPeek) onSnapChange('list') }}
      >
        {peekContent}
      </div>

      {/* ── Main content (hidden when peeking) ── */}
      <div style={{
        flex: 1,
        overflowY: isPeek ? 'hidden' : 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
        opacity: isPeek ? 0 : 1,
        transition: 'opacity 0.2s',
        pointerEvents: isPeek ? 'none' : 'auto',
      }}>
        {children}
      </div>
    </div>
  )
}
