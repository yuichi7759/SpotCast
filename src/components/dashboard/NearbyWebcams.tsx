'use client'
import { useEffect, useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import type { Webcam } from '@/app/api/webcams/route'

function fmtDist(m: number): string {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

// クリック地点の近くにあるライブカメラ（Windy）。近くに無ければ何も表示しない。
export default function NearbyWebcams({ lat, lng }: { lat: number; lng: number }) {
  const { t } = useLocale()
  const [cams, setCams] = useState<Webcam[] | null>(null)

  useEffect(() => {
    let cancelled = false
    setCams(null)
    fetch(`/api/webcams?lat=${lat}&lng=${lng}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled) setCams(d?.webcams ?? []) })
      .catch(() => { if (!cancelled) setCams([]) })
    return () => { cancelled = true }
  }, [lat, lng])

  if (!cams || cams.length === 0) return null

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--dash-text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        📹 {t('weather.webcamTitle')}
      </div>
      <div className="wdp-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {cams.map((c) => (
          <a
            key={c.id}
            href={c.detail}
            target="_blank"
            rel="noopener noreferrer"
            title={c.title}
            style={{
              flexShrink: 0, width: 180, textDecoration: 'none',
              borderRadius: 12, overflow: 'hidden',
              border: '1px solid var(--dash-border)', background: 'var(--dash-surface)',
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: 101, background: 'var(--dash-surface2)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.preview} alt={c.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {/* LIVE バッジ */}
              <div style={{
                position: 'absolute', top: 6, left: 6,
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(0,0,0,0.6)', borderRadius: 5, padding: '2px 6px',
                fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: '0.04em',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 5px #ef4444' }} />
                LIVE
              </div>
            </div>
            <div style={{ padding: '7px 9px 9px' }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--dash-text)', lineHeight: 1.3,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {c.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--dash-text-4)', marginTop: 3 }}>{fmtDist(c.dist)}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
