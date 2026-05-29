'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Field, WeatherData } from '@/types/field'

interface Props {
  lat: number; lng: number; region: string
  fields: Field[]; weather: WeatherData | null
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{`@keyframes shimmerDark{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
      {[70, 100, 85, 60, 90, 75].map((w, i) => (
        <div key={i} style={{
          height: 11, borderRadius: 6,
          background: 'linear-gradient(90deg,rgba(255,255,255,.05) 25%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.05) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmerDark 1.5s infinite',
          width: `${w}%`,
        }}/>
      ))}
    </div>
  )
}

export default function AIBriefing({ lat, lng, region, fields, weather }: Props) {
  const router = useRouter()
  const [briefing, setBriefing] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBriefing = useCallback(async (force = false) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, region, fields, weather, force }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
      setBriefing(data.briefing)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally { setLoading(false) }
  }, [lat, lng, region, fields, weather])

  useEffect(() => { fetchBriefing(false) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div style={{
      background: 'rgba(8,12,18,0.88)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '20px 20px 0 0',
      color: '#f0f0f0',
      maxHeight: '52vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        .brief-content h2 { font-size:14px;font-weight:800;color:#fff;margin:16px 0 6px;display:flex;align-items:center;gap:6px; }
        .brief-content h3 { font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);margin:12px 0 4px; }
        .brief-content p  { font-size:13px;line-height:1.75;color:rgba(255,255,255,0.65);margin:4px 0; }
        .brief-content ul { padding-left:16px;margin:6px 0; }
        .brief-content li { font-size:13px;color:rgba(255,255,255,0.6);margin:3px 0;line-height:1.65; }
        .brief-content strong { color:#fff;font-weight:700; }
        .brief-content .tag-ok  { color:#3ecf8e; }
        .brief-content .tag-warn{ color:#f59e0b; }
      `}</style>

      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
      }}>
        {/* AI icon */}
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #3ecf8e 0%, #059669 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          boxShadow: '0 4px 12px rgba(62,207,142,0.35)',
        }}>🌾</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1 }}>AIデイリーブリーフィング</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{today}</div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchBriefing(true)}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 20,
            background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(62,207,142,0.12)',
            border: `1px solid ${loading ? 'rgba(255,255,255,0.08)' : 'rgba(62,207,142,0.3)'}`,
            color: loading ? 'rgba(255,255,255,0.25)' : '#3ecf8e',
            fontSize: 11, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          {loading ? (
            <>
              <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M7 1v3M7 10v3M1 7h3M10 7h3M2.64 2.64l2.12 2.12M9.24 9.24l2.12 2.12M2.64 11.36l2.12-2.12M9.24 4.76l2.12-2.12"/>
              </svg>
              生成中
            </>
          ) : (
            <>
              <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v4H8"/><path d="M2 12v-4h4"/><path d="M12 6a5 5 0 01-8.7 2.5"/><path d="M2 8a5 5 0 018.7-2.5"/>
              </svg>
              更新
            </>
          )}
        </button>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 20px' }}>
        {loading && <Skeleton />}
        {error && (
          <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171', fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}
        {!loading && briefing && (
          <>
            <div
              className="brief-content"
              dangerouslySetInnerHTML={{
                __html: briefing
                  .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                  .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                  .replace(/^\- (.+)$/gm, '<li>$1</li>')
                  .replace(/(<li>[^]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n\n/g, '</p><p>')
                  .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>')
                  .replace(/<p><\/p>/g, ''),
              }}
            />
          </>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
