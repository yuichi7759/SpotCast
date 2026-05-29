'use client'
import { useState } from 'react'
import type { Field } from '@/types/field'

interface Props {
  lat?: number
  lng?: number
  onSave: (field: Field) => void
  onClose: () => void
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
}

const modalStyle: React.CSSProperties = {
  background: 'rgba(12,18,28,0.95)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 20,
  padding: '24px 24px 20px',
  width: '100%', maxWidth: 420,
  boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  color: '#f0f0f0',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.1)',
  fontSize: 13, color: '#f0f0f0',
  background: 'rgba(255,255,255,0.05)',
  outline: 'none', transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  color: 'rgba(255,255,255,0.4)', marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.07em',
}

const FIELD_COLORS = [
  '#38bdf8', '#60a5fa', '#a78bfa', '#f59e0b',
  '#ef4444', '#f97316', '#ec4899', '#14b8a6',
  '#84cc16', '#e2e8f0',
]

export default function AddFieldModal({ lat, lng, onSave, onClose }: Props) {
  const [name, setName]           = useState('')
  const [crop, setCrop]           = useState('')
  const [variety, setVariety]     = useState('')
  const [plantedAt, setPlantedAt] = useState('')
  const [notes, setNotes]         = useState('')
  const [coordLat, setCoordLat]   = useState(lat?.toFixed(6) ?? '')
  const [coordLng, setCoordLng]   = useState(lng?.toFixed(6) ?? '')
  const [color, setColor]         = useState('#60a5fa')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  function useCurrentLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      setCoordLat(pos.coords.latitude.toFixed(6))
      setCoordLng(pos.coords.longitude.toFixed(6))
    })
  }

  async function handleSave() {
    if (!name.trim()) { setError('ポイント名は必須です'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          crop: crop.trim() || null,
          variety: variety.trim() || null,
          planted_at: plantedAt || null,
          lat: coordLat ? parseFloat(coordLat) : null,
          lng: coordLng ? parseFloat(coordLng) : null,
          notes: notes.trim() || null,
          color: color || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'エラーが発生しました')
      onSave(data as Field)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました')
    } finally { setSaving(false) }
  }

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg, #38bdf8, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, boxShadow: '0 4px 12px rgba(29,78,216,0.35)',
            }}>📍</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', lineHeight: 1 }}>ポイントを追加</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {coordLat && coordLng ? `${parseFloat(coordLat).toFixed(4)}, ${parseFloat(coordLng).toFixed(4)}` : '座標未設定'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              transition: 'all 0.15s',
            }}
          >
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/>
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <label style={labelStyle}>ポイント名 <span style={{ color: '#f87171' }}>*</span></label>
            <input
              style={inputStyle} placeholder="例: 本社屋上・第3観測点・北側農地"
              value={name} onChange={e => setName(e.target.value)} autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>カテゴリ</label>
              <input style={inputStyle} placeholder="農地 / 工場 / 観測点…" value={crop} onChange={e => setCrop(e.target.value)}/>
            </div>
            <div>
              <label style={labelStyle}>種別</label>
              <input style={inputStyle} placeholder="露地 / 施設 / 屋外…" value={variety} onChange={e => setVariety(e.target.value)}/>
            </div>
          </div>

          <div>
            <label style={labelStyle}>関連日付</label>
            <input
              style={{ ...inputStyle, colorScheme: 'dark' }}
              type="date" value={plantedAt} onChange={e => setPlantedAt(e.target.value)}
            />
          </div>

          {/* マーカーカラー */}
          <div>
            <label style={labelStyle}>マーカーカラー</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FIELD_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', border: 'none',
                    background: c, cursor: 'pointer', flexShrink: 0,
                    outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: 2,
                    boxShadow: color === c ? `0 0 10px ${c}99` : 'none',
                    transition: 'all 0.15s',
                    transform: color === c ? 'scale(1.25)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>座標</label>
              <button
                onClick={useCurrentLocation}
                style={{
                  fontSize: 10, color: '#60a5fa', fontWeight: 700,
                  background: 'rgba(29,78,216,0.1)', border: '1px solid rgba(29,78,216,0.2)',
                  borderRadius: 6, padding: '3px 9px', cursor: 'pointer', letterSpacing: '.02em',
                }}
              >
                📍 現在地
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input style={inputStyle} placeholder="緯度 (lat)" value={coordLat} onChange={e => setCoordLat(e.target.value)}/>
              <input style={inputStyle} placeholder="経度 (lng)" value={coordLng} onChange={e => setCoordLng(e.target.value)}/>
            </div>
          </div>

          <div>
            <label style={labelStyle}>メモ</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 66, fontFamily: 'inherit', lineHeight: 1.6 } as React.CSSProperties}
              placeholder="特記事項・メモなど"
              value={notes} onChange={e => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 12, color: '#f87171',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '8px 12px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '11px 0', borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
                background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #3ecf8e, #059669)',
                fontSize: 13, fontWeight: 700,
                color: saving ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: saving ? 'default' : 'pointer',
                boxShadow: saving ? 'none' : '0 4px 16px rgba(29,78,216,0.35)',
                transition: 'all 0.15s',
              }}
            >
              {saving ? '保存中...' : 'ポイントを登録'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
