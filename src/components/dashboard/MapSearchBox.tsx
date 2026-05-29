'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

interface GeoResult {
  id: string
  place_name: string
  text: string
  geometry: { coordinates: [number, number] }  // [lng, lat]
}

interface Props {
  mapboxToken: string
  mapCenter?: [number, number]   // [lng, lat] — for proximity-biased search
  onSelect: (lng: number, lat: number, label: string) => void
}

export default function MapSearchBox({ mapboxToken, mapCenter, onSelect }: Props) {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<GeoResult[]>([])
  const [loading,  setLoading]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [cursor,   setCursor]   = useState(-1)
  const inputRef      = useRef<HTMLInputElement>(null)
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef       = useRef<HTMLDivElement>(null)
  const composingRef  = useRef(false)   // true while IME composition is in progress

  // クリック外で閉じる
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const proximity = mapCenter
        ? `&proximity=${mapCenter[0]},${mapCenter[1]}`
        : '&proximity=136.7,35.7'   // 日本中心にフォールバック
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
        `?access_token=${mapboxToken}&country=jp&language=ja&types=address,place,locality,neighborhood,poi&limit=6` +
        proximity
      const res = await fetch(url)
      const data = await res.json()
      setResults(data.features ?? [])
      setOpen(true)
      setCursor(-1)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [mapboxToken, mapCenter])

  // 「35.6762, 139.6503」や「35.6762 139.6503」形式の座標を検出
  function parseCoords(v: string): { lat: number; lng: number } | null {
    const m = v.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
    if (!m) return null
    const a = parseFloat(m[1]), b = parseFloat(m[2])
    if (isNaN(a) || isNaN(b)) return null
    // 日本の座標範囲チェック（緯度20-46、経度122-154）
    if (a >= 20 && a <= 46 && b >= 122 && b <= 154) return { lat: a, lng: b }
    if (b >= 20 && b <= 46 && a >= 122 && a <= 154) return { lat: b, lng: a }
    // 範囲外でも数値2つなら座標として扱う
    if (a >= -90 && a <= 90 && b >= -180 && b <= 180) return { lat: a, lng: b }
    return null
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!v.trim()) { setResults([]); setOpen(false); return }
    // 座標形式なら即座にプレビュー表示（APIコールなし）
    const coords = parseCoords(v)
    if (coords) {
      setResults([{
        id: '__coords__',
        place_name: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
        text: `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
        geometry: { coordinates: [coords.lng, coords.lat] },
      }])
      setOpen(true)
      setCursor(0)
      return
    }
    timerRef.current = setTimeout(() => search(v), 350)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor(c => Math.min(c + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor(c => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      // IME変換中のEnter（漢字確定）は無視する
      if (composingRef.current) return
      e.preventDefault()
      const target = cursor >= 0 ? results[cursor] : results[0]
      if (target) pick(target)
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  function pick(r: GeoResult) {
    const label = r.id === '__coords__' ? r.place_name : r.text
    setQuery(label)
    setOpen(false)
    setResults([])
    onSelect(r.geometry.coordinates[0], r.geometry.coordinates[1], label)
  }

  function clear() {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: 280 }}>
      {/* 検索入力 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(6,10,16,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${open && results.length > 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: open && results.length > 0 ? '12px 12px 0 0' : 12,
        padding: '7px 10px',
        transition: 'border-color 0.15s, border-radius 0.15s',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}>
        {/* 検索アイコン */}
        {loading ? (
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="rgba(62,207,142,0.8)" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, animation: 'spin 0.8s linear infinite' }}>
            <path d="M8 2a6 6 0 0 1 0 12"/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="4.5"/>
            <line x1="10" y1="10" x2="14" y2="14"/>
          </svg>
        )}

        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { composingRef.current = true }}
          onCompositionEnd={() => { composingRef.current = false }}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder="場所・住所・施設名で検索…"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: '#fff', fontSize: 13, fontWeight: 500,
            caretColor: '#3ecf8e',
          }}
        />

        {query && (
          <button onClick={clear} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: 'rgba(255,255,255,0.35)', flexShrink: 0, lineHeight: 0,
          }}>
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
            </svg>
          </button>
        )}
      </div>

      {/* 結果ドロップダウン */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'rgba(6,10,16,0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 100,
        }}>
          {results.map((r, i) => {
            const isCoord = r.id === '__coords__'
            const active  = i === cursor
            return (
              <div
                key={r.id}
                onMouseDown={e => { e.preventDefault(); pick(r) }}
                onMouseEnter={() => setCursor(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 12px',
                  background: active
                    ? isCoord ? 'rgba(96,165,250,0.12)' : 'rgba(62,207,142,0.1)'
                    : 'transparent',
                  cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.1s',
                }}
              >
                {isCoord ? (
                  /* 座標アイコン */
                  <svg viewBox="0 0 14 14" width="12" height="12" fill="none"
                    stroke={active ? '#60a5fa' : 'rgba(255,255,255,0.3)'}
                    strokeWidth="1.6" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <circle cx="7" cy="7" r="5.5"/>
                    <line x1="1.5" y1="7" x2="12.5" y2="7"/>
                    <line x1="7" y1="1.5" x2="7" y2="12.5"/>
                    <circle cx="7" cy="7" r="1.5" fill={active ? '#60a5fa' : 'rgba(255,255,255,0.3)'} stroke="none"/>
                  </svg>
                ) : (
                  /* 住所アイコン */
                  <svg viewBox="0 0 14 14" width="12" height="12" fill="none"
                    stroke={active ? '#3ecf8e' : 'rgba(255,255,255,0.3)'}
                    strokeWidth="1.6" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    <circle cx="7" cy="6" r="2.5"/>
                    <path d="M7 1C4.24 1 2 3.24 2 6c0 3.5 5 8 5 8s5-4.5 5-8c0-2.76-2.24-5-5-5z"/>
                  </svg>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: active
                      ? isCoord ? '#60a5fa' : '#fff'
                      : 'rgba(255,255,255,0.8)',
                  }}>
                    {isCoord ? r.place_name : r.text}
                  </div>
                  {!isCoord && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                      {r.place_name}
                    </div>
                  )}
                  {isCoord && (
                    <div style={{ fontSize: 10, color: 'rgba(96,165,250,0.5)', marginTop: 1 }}>
                      座標でジャンプ
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <div style={{ padding: '5px 12px', fontSize: 10, color: 'rgba(255,255,255,0.15)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            Powered by Mapbox · 無料枠 10万回/月
          </div>
        </div>
      )}
    </div>
  )
}
