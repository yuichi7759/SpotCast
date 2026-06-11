'use client'
import { useEffect, useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import type { Webcam } from '@/app/api/webcams/route'
import type { NearbyPlace } from '@/app/api/nearby/route'

function fmtDist(m: number): string {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

type Expanded =
  | { kind: 'cam'; item: Webcam }
  | { kind: 'place'; item: NearbyPlace }
  | null

// 選んだポイント近くの「ライブカメラ＋見どころ」を地図下部の帯で表示。
// タップで地図上に大きく表示。カメラ位置は onWebcams 経由で親→MapViewのピンに。
export default function MapMediaStrip({
  lat, lng, bottomOffset = '0', onWebcams,
}: {
  lat: number; lng: number; bottomOffset?: string; onWebcams?: (cams: Webcam[]) => void
}) {
  const { t, locale } = useLocale()
  const [cams, setCams] = useState<Webcam[]>([])
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [expanded, setExpanded] = useState<Expanded>(null)

  useEffect(() => {
    let cancelled = false
    setExpanded(null); setCams([]); setPlaces([])
    Promise.all([
      fetch(`/api/webcams?lat=${lat}&lng=${lng}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/nearby?lat=${lat}&lng=${lng}&lang=${locale}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([w, p]) => {
      if (cancelled) return
      const wc: Webcam[] = w?.webcams ?? []
      setCams(wc)
      setPlaces(p?.places ?? [])
      onWebcams?.(wc)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, locale])

  if (cams.length === 0 && places.length === 0) return null

  return (
    <>
      {/* 大きく表示（ライトボックス） */}
      {expanded && (
        <div
          onClick={() => setExpanded(null)}
          style={{
            position: 'absolute', inset: 0, zIndex: 28,
            background: 'rgba(4,7,12,0.66)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 'min(92%, 440px)', maxHeight: '88%', overflow: 'hidden',
              background: '#0a0e16', border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 16, display: 'flex', flexDirection: 'column',
              boxShadow: '0 16px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: 'var(--dash-surface2)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={expanded.kind === 'cam' ? expanded.item.preview : expanded.item.thumbnail}
                alt={expanded.item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {expanded.kind === 'cam' && (
                <div style={{ position: 'absolute', top: 9, left: 9, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 5px #ef4444' }} />
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em' }}>LIVE</span>
                </div>
              )}
              <button
                onClick={() => setExpanded(null)}
                aria-label="close"
                style={{ position: 'absolute', top: 7, right: 7, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
              </button>
            </div>
            <div style={{ padding: '11px 14px 13px' }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>{expanded.item.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M7 1.5c2.2 0 4 1.8 4 4 0 3-4 7-4 7s-4-4-4-7c0-2.2 1.8-4 4-4z"/><circle cx="7" cy="5.5" r="1.4"/></svg>
                {expanded.kind === 'cam'
                  ? `${expanded.item.city ? expanded.item.city + ' · ' : ''}${fmtDist(expanded.item.dist)}`
                  : fmtDist(expanded.item.dist)}
              </div>
              {expanded.kind === 'place' && expanded.item.extract && (
                <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 12.5, lineHeight: 1.55, marginTop: 8 }}>{expanded.item.extract}</div>
              )}
              <a
                href={expanded.kind === 'cam' ? expanded.item.detail : expanded.item.url}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, padding: '8px 13px', borderRadius: 9, background: 'rgba(96,165,250,0.16)', border: '1px solid rgba(96,165,250,0.4)', color: '#93c5fd', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}
              >
                {expanded.kind === 'cam' ? t('media.windy') : t('media.wiki')}
                <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2h6v6M10 2L3 9"/></svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 下部の帯（カメラ→見どころ） */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottomOffset, zIndex: 24, padding: '8px 10px', pointerEvents: 'none' }}>
        <div className="wdp-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', pointerEvents: 'auto', scrollbarWidth: 'none' }}>
          {cams.map(c => (
            <button key={`c${c.id}`} onClick={() => setExpanded({ kind: 'cam', item: c })}
              style={{ flex: '0 0 auto', width: 110, padding: 0, borderRadius: 9, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.16)', background: '#0a0e16', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ position: 'relative', height: 62, background: 'var(--dash-surface2)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.preview} alt={c.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '1px 5px' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ color: '#fff', fontSize: 9, fontWeight: 800 }}>LIVE</span>
                </div>
              </div>
              <div style={{ padding: '4px 7px 6px' }}>
                <div style={{ color: '#fff', fontSize: 11, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{fmtDist(c.dist)}</div>
              </div>
            </button>
          ))}
          {places.map((p, i) => (
            <button key={`p${i}`} onClick={() => setExpanded({ kind: 'place', item: p })}
              style={{ flex: '0 0 auto', width: 110, padding: 0, borderRadius: 9, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.16)', background: '#0a0e16', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ position: 'relative', height: 62, background: 'var(--dash-surface2)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbnail} alt={p.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.55)', borderRadius: 4, padding: '1px 5px', color: '#fde68a', fontSize: 9, fontWeight: 800 }}>{t('media.spot')}</div>
              </div>
              <div style={{ padding: '4px 7px 6px' }}>
                <div style={{ color: '#fff', fontSize: 11, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{fmtDist(p.dist)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
