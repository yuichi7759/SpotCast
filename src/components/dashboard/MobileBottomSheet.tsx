'use client'
import { useRef, useState, useEffect, ReactNode, useCallback } from 'react'

export type SheetSnap = 'peek' | 'list' | 'detail'

interface Props {
  snap: SheetSnap
  onSnapChange: (s: SheetSnap) => void
  peekContent: ReactNode
  children: ReactNode
}

// Snap heights as CSS strings using dvh (dynamic viewport height).
// dvh tracks the *visible* viewport, so the sheet does NOT jump when the mobile
// browser's address bar shows/hides — this is what kills the "wobble".
const PEEK_PX = 84
const SNAP_CSS: Record<SheetSnap, string> = {
  peek:   `${PEEK_PX}px`,
  list:   '56dvh',
  detail: '90dvh',
}

// px equivalents (for nearest-snap math during a drag-release only)
function snapPx(s: SheetSnap, vh: number): number {
  if (s === 'peek')   return PEEK_PX
  if (s === 'list')   return Math.round(vh * 0.56)
  return Math.round(vh * 0.90)
}

function nearestSnap(h: number, vh: number): SheetSnap {
  const order: SheetSnap[] = ['peek', 'list', 'detail']
  return order.reduce((best, cur) =>
    Math.abs(snapPx(cur, vh) - h) < Math.abs(snapPx(best, vh) - h) ? cur : best
  , 'peek' as SheetSnap)
}

export default function MobileBottomSheet({ snap, onSnapChange, peekContent, children }: Props) {
  // height is a CSS string for snapped states (dvh) and a px string while dragging.
  const [height, setHeight]       = useState<string>(SNAP_CSS[snap])
  const [dragging, setDragging]   = useState(false)
  const [transitioning, setTrans] = useState(false)
  const startY   = useRef(0)
  const startH   = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Sync snap → height (CSS dvh) with a transition, only when not actively dragging.
  useEffect(() => {
    if (dragging) return
    setTrans(true)
    setHeight(SNAP_CSS[snap])
    const t = setTimeout(() => setTrans(false), 320)
    return () => clearTimeout(t)
  }, [snap, dragging])

  const beginDrag = useCallback((clientY: number) => {
    setDragging(true)
    setTrans(false)
    startY.current = clientY
    startH.current = sheetRef.current?.offsetHeight ?? PEEK_PX
  }, [])

  const moveDrag = useCallback((clientY: number) => {
    if (!dragging) return
    const delta = startY.current - clientY
    const vh = window.innerHeight
    const next = Math.max(PEEK_PX - 8, Math.min(vh * 0.92, startH.current + delta))
    setHeight(`${next}px`)
  }, [dragging])

  const endDrag = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    const vh = window.innerHeight
    const curPx = sheetRef.current?.offsetHeight ?? PEEK_PX
    const s = nearestSnap(curPx, vh)
    onSnapChange(s)
    setTrans(true)
    setHeight(SNAP_CSS[s])
    setTimeout(() => setTrans(false), 320)
  }, [dragging, onSnapChange])

  // Global listeners only while dragging.
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent | TouchEvent) => moveDrag('touches' in e ? e.touches[0].clientY : e.clientY)
    const onEnd  = () => endDrag()
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
        maxHeight: '92dvh',
        background: 'var(--dash-panel)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--dash-border)',
        borderRadius: '20px 20px 0 0',
        transition: transitioning ? 'height 0.30s cubic-bezier(0.32,0.72,0,1)' : 'none',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        // Respect the iOS home-indicator safe area so content isn't clipped.
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ── Drag handle + peek row (the whole bar is the grab/tap target) ── */}
      <div
        style={{
          flexShrink: 0,
          padding: '8px 16px 8px',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onMouseDown={e => beginDrag(e.clientY)}
        onTouchStart={e => beginDrag(e.touches[0].clientY)}
        onClick={() => { if (isPeek) onSnapChange('list') }}
      >
        <div style={{
          width: 38, height: 4, borderRadius: 2,
          background: 'var(--dash-border-strong)',
          margin: '0 auto 8px',
        }}/>
        {peekContent}
      </div>

      {/* ── Main content (hidden when peeking) ── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: isPeek ? 'hidden' : 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        opacity: isPeek ? 0 : 1,
        transition: 'opacity 0.2s',
        pointerEvents: isPeek ? 'none' : 'auto',
        // The list/detail content scrolls; let touches there scroll instead of dragging the sheet.
        touchAction: 'pan-y',
      }}>
        {children}
      </div>
    </div>
  )
}
