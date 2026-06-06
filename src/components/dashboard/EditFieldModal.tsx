'use client'
import { useState } from 'react'
import type { Field } from '@/types/field'
import { useT } from '@/components/LocaleProvider'

interface Props {
  field: Field
  mapCenter?: [number, number]   // current map center [lng, lat]
  onSave: (field: Field) => void
  onClose: () => void
  onDelete?: (id: string) => void
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.65)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 16,
}

const modalStyle: React.CSSProperties = {
  background: 'var(--dash-panel-solid)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid var(--dash-border)',
  borderRadius: 20,
  padding: '24px 24px 20px',
  width: '100%', maxWidth: 440,
  boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  color: 'var(--dash-text)',
  maxHeight: '90vh',
  overflowY: 'auto',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: 10,
  border: '1px solid var(--dash-border)',
  fontSize: 14, color: 'var(--dash-text)',
  background: 'var(--dash-surface)',
  outline: 'none', transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: 'var(--dash-text-3)', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.07em',
}

const FIELD_COLORS = [
  '#38bdf8', '#60a5fa', '#a78bfa', '#f59e0b',
  '#ef4444', '#f97316', '#ec4899', '#14b8a6',
  '#84cc16', '#e2e8f0',
]

export default function EditFieldModal({ field, mapCenter, onSave, onClose, onDelete }: Props) {
  const t = useT()
  const [name,      setName]      = useState(field.name)
  const [crop,      setCrop]      = useState(field.crop ?? '')
  const [variety,   setVariety]   = useState(field.variety ?? '')
  const [plantedAt, setPlantedAt] = useState(field.planted_at ?? '')
  const [notes,     setNotes]     = useState(field.notes ?? '')
  const [coordLat,  setCoordLat]  = useState(field.lat?.toFixed(6) ?? '')
  const [coordLng,  setCoordLng]  = useState(field.lng?.toFixed(6) ?? '')
  const [color,     setColor]     = useState(field.color ?? '#60a5fa')
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [error,     setError]     = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  function useCurrentLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(pos => {
      setCoordLat(pos.coords.latitude.toFixed(6))
      setCoordLng(pos.coords.longitude.toFixed(6))
    })
  }

  function useMapCenter() {
    if (!mapCenter) return
    setCoordLng(mapCenter[0].toFixed(6))
    setCoordLat(mapCenter[1].toFixed(6))
  }

  async function handleSave() {
    if (!name.trim()) { setError(t('field.nameRequired')); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       name.trim(),
          crop:       crop.trim()      || null,
          variety:    variety.trim()   || null,
          planted_at: plantedAt        || null,
          lat:        coordLat ? parseFloat(coordLat) : null,
          lng:        coordLng ? parseFloat(coordLng) : null,
          notes:      notes.trim()     || null,
          color:      color            || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('common.error'))
      onSave(data as Field)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'))
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!onDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/fields/${field.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(t('field.deleteFail'))
      onDelete(field.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除エラー')
      setDeleting(false)
      setConfirmDel(false)
    }
  }

  const coordPreview = coordLat && coordLng
    ? `${parseFloat(coordLat).toFixed(4)}, ${parseFloat(coordLng).toFixed(4)}`
    : t('field.coordsUnset')

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalStyle}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(29,78,216,0.3), rgba(5,150,105,0.2))',
              border: '1px solid rgba(29,78,216,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>✏️</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--dash-text)', lineHeight: 1 }}>{t('field.editTitle')}</div>
              <div style={{ fontSize: 11, color: 'var(--dash-text-4)', marginTop: 3 }}>{coordPreview}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--dash-surface2)', border: '1px solid var(--dash-border)',
            borderRadius: 8, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--dash-text-3)',
          }}>
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12"/><line x1="12" y1="2" x2="2" y2="12"/>
            </svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>

          {/* ポイント名 */}
          <div>
            <label style={labelStyle}>{t("field.name")} <span style={{ color: '#f87171' }}>*</span></label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} autoFocus/>
          </div>

          {/* カテゴリ・種別 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>{t("field.category")}</label>
              <input style={inputStyle} placeholder={t("field.categoryPh")} value={crop} onChange={e => setCrop(e.target.value)}/>
            </div>
            <div>
              <label style={labelStyle}>{t("field.type")}</label>
              <input style={inputStyle} placeholder={t("field.typePh")} value={variety} onChange={e => setVariety(e.target.value)}/>
            </div>
          </div>

          {/* 日付 */}
          <div>
            <label style={labelStyle}>{t("field.date")}</label>
            <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date"
              value={plantedAt} onChange={e => setPlantedAt(e.target.value)}/>
          </div>

          {/* マーカーカラー */}
          <div>
            <label style={labelStyle}>{t("field.color")}</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FIELD_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', border: 'none',
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

          {/* 座標 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{t("field.coords")}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {mapCenter && (
                  <button onClick={useMapCenter} style={{
                    fontSize: 11, color: '#a78bfa', fontWeight: 700,
                    background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)',
                    borderRadius: 7, padding: '4px 10px', cursor: 'pointer',
                  }}>
                    🗺 {t("field.mapCenter")}
                  </button>
                )}
                <button onClick={useCurrentLocation} style={{
                  fontSize: 11, color: '#60a5fa', fontWeight: 700,
                  background: 'rgba(29,78,216,0.1)', border: '1px solid rgba(29,78,216,0.2)',
                  borderRadius: 7, padding: '4px 10px', cursor: 'pointer',
                }}>
                  📍 {t("field.currentLoc")}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--dash-text-4)', marginBottom: 4 }}>{t("field.lat")}</div>
                <input style={inputStyle} placeholder="35.6762" value={coordLat} onChange={e => setCoordLat(e.target.value)}/>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--dash-text-4)', marginBottom: 4 }}>{t("field.lng")}</div>
                <input style={inputStyle} placeholder="139.6503" value={coordLng} onChange={e => setCoordLng(e.target.value)}/>
              </div>
            </div>
            {coordLat && coordLng && (
              <div style={{ fontSize: 11, color: 'var(--dash-text-4)', marginTop: 6, textAlign: 'right' }}>
                → {parseFloat(coordLat).toFixed(5)}, {parseFloat(coordLng).toFixed(5)}
              </div>
            )}
          </div>

          {/* メモ */}
          <div>
            <label style={labelStyle}>{t("field.memo")}</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 70, fontFamily: 'inherit', lineHeight: 1.6 } as React.CSSProperties}
              placeholder={t("field.memoPh")}
              value={notes} onChange={e => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <div style={{
              fontSize: 13, color: '#f87171',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '9px 13px',
            }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '12px 0', borderRadius: 10,
              border: '1px solid var(--dash-border)',
              background: 'var(--dash-surface)',
              fontSize: 14, fontWeight: 600, color: 'var(--dash-text-3)', cursor: 'pointer',
            }}>{t("common.cancel")}</button>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 2, padding: '12px 0', borderRadius: 10, border: 'none',
              background: saving ? 'var(--dash-border)' : 'linear-gradient(135deg, #3ecf8e, #059669)',
              fontSize: 14, fontWeight: 700,
              color: saving ? 'rgba(255,255,255,0.6)' : '#fff',
              cursor: saving ? 'default' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(29,78,216,0.35)',
              transition: 'all 0.15s',
            }}>
              {saving ? t('field.saving') : t('field.saveChanges')}
            </button>
          </div>

          {/* Delete */}
          {onDelete && (
            <div style={{ borderTop: '1px solid var(--dash-surface2)', paddingTop: 14 }}>
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)} style={{
                  width: '100%', padding: '10px 0', borderRadius: 10,
                  border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.05)',
                  fontSize: 13, fontWeight: 600, color: 'rgba(239,68,68,0.7)', cursor: 'pointer',
                }}>
                  🗑 {t("field.deletePoint")}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--dash-text-3)', flex: 1 }}>{t('field.confirmDelete')}</div>
                  <button onClick={() => setConfirmDel(false)} style={{
                    padding: '8px 14px', borderRadius: 8,
                    border: '1px solid var(--dash-border)',
                    background: 'var(--dash-surface)',
                    fontSize: 13, color: 'var(--dash-text-3)', cursor: 'pointer',
                  }}>{t("common.back")}</button>
                  <button onClick={handleDelete} disabled={deleting} style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: deleting ? 'rgba(239,68,68,0.3)' : '#ef4444',
                    fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                  }}>
                    {deleting ? t('field.deleting') : t('field.delete')}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
