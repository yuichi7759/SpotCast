'use client'
import { useEffect, useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'
import type { NearbyPlace } from '@/app/api/nearby/route'

function fmtDist(m: number): string {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

// クリック地点の「周辺の見どころ」（Wikipedia）。見どころが無ければ何も表示しない。
export default function NearbyPlaces({ lat, lng }: { lat: number; lng: number }) {
  const { t, locale } = useLocale()
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null)

  useEffect(() => {
    let cancelled = false
    setPlaces(null)
    fetch(`/api/nearby?lat=${lat}&lng=${lng}&lang=${locale}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled) setPlaces(d?.places ?? []) })
      .catch(() => { if (!cancelled) setPlaces([]) })
    return () => { cancelled = true }
  }, [lat, lng, locale])

  // ロード中・見どころ無しは静かに非表示
  if (!places || places.length === 0) return null

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--dash-text-2)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        📍 {t('weather.nearbyTitle')}
      </div>
      <div className="wdp-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {places.map((p, i) => (
          <a
            key={i}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            title={p.extract}
            style={{
              flexShrink: 0, width: 150, textDecoration: 'none',
              borderRadius: 12, overflow: 'hidden',
              border: '1px solid var(--dash-border)', background: 'var(--dash-surface)',
            }}
          >
            <div style={{ width: '100%', height: 96, background: 'var(--dash-surface2)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbnail} alt={p.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ padding: '7px 9px 9px' }}>
              <div style={{
                fontSize: 12.5, fontWeight: 700, color: 'var(--dash-text)', lineHeight: 1.3,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {p.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--dash-text-4)', marginTop: 3 }}>{fmtDist(p.dist)}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
