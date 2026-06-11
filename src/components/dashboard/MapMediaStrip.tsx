'use client'
import { useLocale } from '@/components/LocaleProvider'
import type { Webcam } from '@/app/api/webcams/route'
import type { NearbyPlace } from '@/app/api/nearby/route'

function fmtDist(m: number): string {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

// 画像の取得日時（閲覧者のローカル時刻で M/D HH:MM）
function fmtDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const M = d.getMonth() + 1, D = d.getDate()
  const h = String(d.getHours()).padStart(2, '0'), m = String(d.getMinutes()).padStart(2, '0')
  return `${M}/${D} ${h}:${m}`
}

export type Expanded =
  | { kind: 'cam'; n: number; item: Webcam }
  | { kind: 'place'; n: number; item: NearbyPlace }
  | null

export interface Media { cams: Webcam[]; places: NearbyPlace[] }

const CAM = '#2e7bd6'    // カメラ＝青
const SPOT = '#e0962a'   // 見どころ＝アンバー

// 番号バッジ（サムネ↔地図ピンを一致させる）
function NumBadge({ n, color }: { n: number; color: string }) {
  return (
    <span style={{
      position: 'absolute', top: 4, right: 4,
      minWidth: 15, height: 15, borderRadius: 8, padding: '0 3px',
      background: color, color: '#fff', fontSize: 9.5, fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(255,255,255,.6)',
    }}>{n}</span>
  )
}

// 地図下部の帯（ライブカメラ＋見どころ）。データ・展開状態は親(dashboard)が保持。
export default function MapMediaStrip({
  media, expanded, onExpand, bottomOffset = '0',
}: {
  media: Media | null
  expanded: Expanded
  onExpand: (e: Expanded) => void
  bottomOffset?: string
}) {
  const { t } = useLocale()
  if (!media || (media.cams.length === 0 && media.places.length === 0)) return null
  const { cams, places } = media

  return (
    <>
      {expanded && (
        <div onClick={() => onExpand(null)} style={{ position: 'absolute', inset: 0, zIndex: 28, background: 'rgba(4,7,12,0.66)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 'min(92%, 420px)', maxHeight: '88%', overflow: 'hidden', background: '#0a0e16', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 16px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: 'var(--dash-surface2)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={expanded.kind === 'cam' ? expanded.item.preview : expanded.item.thumbnail} alt={expanded.item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', top: 9, left: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px', background: expanded.kind === 'cam' ? CAM : SPOT, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,.6)' }}>{expanded.n}</span>
                {expanded.kind === 'cam' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>LIVE</span>
                  </span>
                )}
              </div>
              <button onClick={() => onExpand(null)} aria-label="close" style={{ position: 'absolute', top: 7, right: 7, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>
              </button>
            </div>
            <div style={{ padding: '11px 14px 13px' }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>{expanded.item.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M7 1.5c2.2 0 4 1.8 4 4 0 3-4 7-4 7s-4-4-4-7c0-2.2 1.8-4 4-4z"/><circle cx="7" cy="5.5" r="1.4"/></svg>
                {expanded.kind === 'cam' ? `${expanded.item.city ? expanded.item.city + ' · ' : ''}${fmtDist(expanded.item.dist)}` : fmtDist(expanded.item.dist)}
              </div>
              {expanded.kind === 'place' && expanded.item.extract && (
                <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 12.5, lineHeight: 1.55, marginTop: 8 }}>{expanded.item.extract}</div>
              )}
              {expanded.kind === 'cam' ? (
                expanded.item.updated && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="8" r="6.3"/><path d="M8 4.6V8l2.4 1.4"/></svg>
                    {t('media.captured')} {fmtDateTime(expanded.item.updated)}
                  </div>
                )
              ) : (
                <a href={expanded.item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, padding: '8px 13px', borderRadius: 9, background: 'rgba(96,165,250,0.16)', border: '1px solid rgba(96,165,250,0.4)', color: '#93c5fd', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>
                  {t('media.wiki')}
                  <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2h6v6M10 2L3 9"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 下部の小さめワイプ帯（カメラ→見どころ。番号で地図ピンと対応） */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottomOffset, zIndex: 24, padding: '6px 8px', pointerEvents: 'none' }}>
        <div className="wdp-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', pointerEvents: 'auto', scrollbarWidth: 'none' }}>
          {cams.map((c, i) => (
            <button key={`c${c.id}`} onClick={() => onExpand({ kind: 'cam', n: i + 1, item: c })}
              style={{ flex: '0 0 auto', width: 84, padding: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${expanded?.kind === 'cam' && expanded.n === i + 1 ? CAM : 'rgba(255,255,255,0.16)'}`, background: '#0a0e16', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ position: 'relative', height: 48, background: 'var(--dash-surface2)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.preview} alt={c.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: 3, left: 3, display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.6)', borderRadius: 3, padding: '0 3px' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ color: '#fff', fontSize: 8, fontWeight: 800 }}>LIVE</span>
                </div>
                <NumBadge n={i + 1} color={CAM} />
              </div>
              <div style={{ padding: '3px 5px 4px' }}>
                <div style={{ color: '#fff', fontSize: 9.5, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8.5 }}>{fmtDist(c.dist)}</div>
              </div>
            </button>
          ))}
          {places.map((p, i) => (
            <button key={`p${i}`} onClick={() => onExpand({ kind: 'place', n: i + 1, item: p })}
              style={{ flex: '0 0 auto', width: 84, padding: 0, borderRadius: 8, overflow: 'hidden', border: `1px solid ${expanded?.kind === 'place' && expanded.n === i + 1 ? SPOT : 'rgba(255,255,255,0.16)'}`, background: '#0a0e16', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ position: 'relative', height: 48, background: 'var(--dash-surface2)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbnail} alt={p.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: 3, left: 3, background: 'rgba(0,0,0,0.55)', borderRadius: 3, padding: '0 3px', color: '#fde68a', fontSize: 8, fontWeight: 800 }}>{t('media.spot')}</div>
                <NumBadge n={i + 1} color={SPOT} />
              </div>
              <div style={{ padding: '3px 5px 4px' }}>
                <div style={{ color: '#fff', fontSize: 9.5, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 8.5 }}>{fmtDist(p.dist)}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
