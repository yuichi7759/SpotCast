'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Field } from '@/types/field'
import PointList from '@/components/dashboard/PointList'
import AddFieldModal from '@/components/dashboard/AddFieldModal'
import EditFieldModal from '@/components/dashboard/EditFieldModal'
import WeatherDetailPanel from '@/components/dashboard/WeatherDetailPanel'
import WeatherDetailStrip from '@/components/dashboard/WeatherDetailStrip'
import WeatherStrip from '@/components/dashboard/WeatherStrip'
import MapSearchBox from '@/components/dashboard/MapSearchBox'
import BestDayMatrix from '@/components/dashboard/BestDayMatrix'
import MobileBottomSheet, { type SheetSnap } from '@/components/dashboard/MobileBottomSheet'
import AccountMenu from '@/components/layout/AccountMenu'
import { useToast } from '@/components/ToastProvider'
import { createClient } from '@/lib/supabase/client'
import type { IntelligenceEvent } from '@/lib/mockIntelligence'

const FREE_POINT_LIMIT = 3

const MapView = dynamic(() => import('@/components/dashboard/MapView'), { ssr: false })

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export default function DashboardPage() {
  const toast = useToast()

  const [fields,            setFields]          = useState<Field[]>([])
  const [selectedField,     setSelected]        = useState<Field | null>(null)
  const [selectedEventId,   setSelectedEvent]   = useState<string | null>(null)
  const [mapCenter,         setCenter]          = useState<[number, number] | undefined>()
  const [mapZoom,           setZoom]            = useState<number | undefined>()
  const [pendingCoords,     setPending]         = useState<{ lat: number; lng: number } | null>(null)
  const [showModal,         setShowModal]       = useState(false)
  const [loadingFields,     setLoadingFields]   = useState(true)
  const [editingField,      setEditingField]    = useState<Field | null>(null)
  const [mapCurrentCenter,  setMapCurrentCenter] = useState<[number, number] | undefined>()
  const [ctxMenu,           setCtxMenu]         = useState<{ lat: number; lng: number; x: number; y: number } | null>(null)
  const [searchPin,         setSearchPin]       = useState<{ lng: number; lat: number; label: string } | null>(null)
  const [mobileSnap,        setMobileSnap]      = useState<SheetSnap>('peek')
  const [showRainRadar,     setShowRainRadar]   = useState(false)
  const [weatherRefreshKey, setWeatherRefreshKey] = useState(0)
  const [refreshing,        setRefreshing]       = useState(false)
  const [leftPanelWidth,    setLeftPanelWidth]   = useState(240)
  const [bottomPanelHeight, setBottomPanelHeight] = useState(280)
  const [rightPanelWidth,   setRightPanelWidth]  = useState(420)
  const [plan,              setPlan]             = useState<'free' | 'standard'>('free')
  const isResizingRight  = useRef(false)
  const resizeStartXR    = useRef(0)
  const resizeStartWR    = useRef(0)
  const isResizingLeft   = useRef(false)
  const resizeStartX     = useRef(0)
  const resizeStartW     = useRef(0)
  const isResizingBottom = useRef(false)
  const resizeStartY     = useRef(0)
  const resizeStartH     = useRef(0)


  const loadFields = useCallback(async () => {
    try {
      const res = await fetch('/api/fields')
      if (res.ok) setFields(await res.json())
    } catch {}
    setLoadingFields(false)
  }, [])
  useEffect(() => { loadFields() }, [loadFields])

  // プラン取得
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: row } = await supabase.from('users').select('plan').eq('id', data.user.id).single()
      if (row?.plan === 'pro') setPlan('standard')
    })
  }, [])

  function handleMapClick(_lat: number, _lng: number) {
    setCtxMenu(null)
    setSearchPin(null)
  }

  function handleMapRightClick(lat: number, lng: number, x: number, y: number) {
    setCtxMenu({ lat, lng, x, y })
  }

  async function handleCtxAddField() {
    if (!ctxMenu) return
    setPending({ lat: ctxMenu.lat, lng: ctxMenu.lng })
    setShowModal(true)
    setCtxMenu(null)
  }

  async function handleCtxSetLocation() {
    if (!ctxMenu || !selectedField) return
    const { lat, lng } = ctxMenu
    setCtxMenu(null)
    try {
      const res = await fetch(`/api/fields/${selectedField.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selectedField, lat, lng }),
      })
      if (res.ok) {
        const updated: Field = await res.json()
        setFields(prev => prev.map(f => f.id === updated.id ? updated : f))
        setSelected(updated)
        setCenter([lng, lat]); setZoom(15)
        toast.success(`「${updated.name}」の場所を更新しました`)
      }
    } catch {
      toast.info('場所の更新に失敗しました')
    }
  }

  function handleFieldClick(field: Field) {
    setSelected(field)
    setSelectedEvent(null)
    if (field.lat != null && field.lng != null) {
      setCenter([field.lng, field.lat])
      setZoom(15)
    }
    setMobileSnap('detail')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleIntelClick(_ev: IntelligenceEvent) {}

  function handleSearchSelect(lng: number, lat: number, label: string) {
    setCenter([lng, lat])
    setZoom(17)
    setSearchPin({ lng, lat, label })
  }

  function handleFieldEdited(updated: Field) {
    setFields(prev => prev.map(f => f.id === updated.id ? updated : f))
    setEditingField(null)
    if (updated.lat != null && updated.lng != null) {
      setCenter([updated.lng, updated.lat])
      setZoom(15)
    }
    toast.success(`「${updated.name}」を更新しました`)
  }

  function handleFieldDeleted(id: string) {
    setFields(prev => prev.filter(f => f.id !== id))
    setEditingField(null)
    if (selectedField?.id === id) setSelected(null)
    toast.info('ポイントを削除しました')
  }

  function handleFieldAdded(field: Field) {
    setFields(prev => [field, ...prev])
    setShowModal(false); setPending(null)
    handleFieldClick(field)
    toast.success(`「${field.name}」を登録しました`, "マップにピンが追加されました")
  }

  function handleAddClick() {
    if (plan === 'free' && fields.length >= FREE_POINT_LIMIT) {
      toast.info(`Freeプランは${FREE_POINT_LIMIT}件まで`, 'Standardプランにアップグレードすると無制限に登録できます')
      return
    }
    setPending(null); setShowModal(true)
  }

  // ─────────────────────────────────────────────────────────
  // Left panel resize
  // ─────────────────────────────────────────────────────────
  function handleLeftResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    isResizingLeft.current = true
    resizeStartX.current   = e.clientX
    resizeStartW.current   = leftPanelWidth

    function onMove(ev: MouseEvent) {
      if (!isResizingLeft.current) return
      const delta = ev.clientX - resizeStartX.current
      const next  = Math.min(480, Math.max(160, resizeStartW.current + delta))
      setLeftPanelWidth(next)
    }
    function onUp() {
      isResizingLeft.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  // ─────────────────────────────────────────────────────────
  // Right panel resize
  // ─────────────────────────────────────────────────────────
  function handleRightResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    isResizingRight.current = true
    resizeStartXR.current   = e.clientX
    resizeStartWR.current   = rightPanelWidth
    function onMove(ev: MouseEvent) {
      if (!isResizingRight.current) return
      const delta = resizeStartXR.current - ev.clientX
      const next  = Math.min(700, Math.max(300, resizeStartWR.current + delta))
      setRightPanelWidth(next)
    }
    function onUp() {
      isResizingRight.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  // ─────────────────────────────────────────────────────────
  // Bottom panel resize
  // ─────────────────────────────────────────────────────────
  function handleBottomResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    isResizingBottom.current = true
    resizeStartY.current     = e.clientY
    resizeStartH.current     = bottomPanelHeight

    function onMove(ev: MouseEvent) {
      if (!isResizingBottom.current) return
      const delta = resizeStartY.current - ev.clientY   // 上にドラッグ→高さ増加
      const next  = Math.min(520, Math.max(80, resizeStartH.current + delta))
      setBottomPanelHeight(next)
    }
    function onUp() {
      isResizingBottom.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      document.body.style.cursor     = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor     = 'row-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  // ─────────────────────────────────────────────────────────
  // Shared sub-elements
  // ─────────────────────────────────────────────────────────
  const mapViewEl = (
    <MapView
      fields={fields}
      intelligenceEvents={[]}
      selectedEventId={selectedEventId}
      selectedFieldId={selectedField?.id}
      searchPin={searchPin}
      onMapClick={handleMapClick}
      onMapRightClick={handleMapRightClick}
      onFieldClick={handleFieldClick}
      onIntelClick={handleIntelClick}
      onMoveEnd={setMapCurrentCenter}
      center={mapCenter}
      zoom={mapZoom}
      showRainRadar={showRainRadar}
    />
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#060a10' }}>

      {/* ══════════════════════════════════════════════════
          DESKTOP LAYOUT  (hidden on mobile)
      ══════════════════════════════════════════════════ */}
      <div className="hidden sm:flex" style={{ width: '100%', height: '100%', flexDirection: 'column' }}>

        {/* ── Top row: PointList + Map + BestDayMatrix ── */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

          {/* Left — PointList (resizable) */}
          <div style={{
            width: leftPanelWidth, flexShrink: 0, height: '100%', overflow: 'hidden',
            position: 'relative',
          }}>
            <PointList
              points={fields}
              selectedPointId={selectedField?.id}
              onPointClick={handleFieldClick}
              onPointEdit={f => setEditingField(f)}
              onAdd={handleAddClick}
            />
            {/* Resize handle */}
            <div
              onMouseDown={handleLeftResizeMouseDown}
              style={{
                position: 'absolute', top: 0, right: 0, width: 5, height: '100%',
                cursor: 'col-resize', zIndex: 20,
                background: 'transparent',
                borderRight: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(62,207,142,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            />
          </div>

          {/* Center — Map + overlays */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

            {/* Map */}
            <div style={{ position: 'absolute', inset: 0 }}>{mapViewEl}</div>

            {/* Top gradient */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 70,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
              pointerEvents: 'none', zIndex: 5,
            }}/>

            {/* Top bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              padding: '10px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              zIndex: 10, pointerEvents: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
                <button
                  onClick={() => { setCenter([136.7, 35.7]); setZoom(5) }}
                  title="全国表示に戻る"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34,
                    background: 'rgba(6,10,16,0.75)', backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                    cursor: 'pointer', color: 'rgba(255,255,255,0.55)',
                    transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                  onMouseEnter={e => {
                    const b = e.currentTarget as HTMLButtonElement
                    b.style.color = '#fff'
                    b.style.borderColor = 'rgba(62,207,142,0.5)'
                    b.style.boxShadow = '0 0 12px rgba(62,207,142,0.25), 0 2px 8px rgba(0,0,0,0.3)'
                  }}
                  onMouseLeave={e => {
                    const b = e.currentTarget as HTMLButtonElement
                    b.style.color = 'rgba(255,255,255,0.55)'
                    b.style.borderColor = 'rgba(255,255,255,0.12)'
                    b.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  <svg viewBox="0 0 18 18" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                    <circle cx="9" cy="9" r="7.2"/>
                    <ellipse cx="9" cy="9" rx="3.2" ry="7.2"/>
                    <line x1="1.8" y1="9" x2="16.2" y2="9"/>
                    <path d="M2.8 5.5 Q9 4 15.2 5.5"/>
                    <path d="M2.8 12.5 Q9 14 15.2 12.5"/>
                  </svg>
                </button>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                  {loadingFields ? '読込中…' : `登録ポイント ${fields.length}件`}
                </div>
              </div>

              <div style={{ pointerEvents: 'auto' }}>
                <MapSearchBox
                  mapboxToken={MAPBOX_TOKEN}
                  mapCenter={mapCurrentCenter}
                  onSelect={handleSearchSelect}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto' }}>
                {/* Rain radar toggle */}
                <button
                  onClick={() => {
                    if (plan === 'free') {
                      toast.info('雨雲レーダーはStandardプランの機能です', 'アップグレードしてご利用ください')
                      return
                    }
                    setShowRainRadar(p => !p)
                  }}
                  title={showRainRadar ? '雨雲レーダーを非表示' : '雨雲レーダーを表示'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20, height: 28,
                    background: showRainRadar ? 'rgba(96,165,250,0.2)' : 'rgba(6,10,16,0.72)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${showRainRadar ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: showRainRadar ? '#60a5fa' : 'rgba(255,255,255,0.45)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: showRainRadar ? '0 0 10px rgba(96,165,250,0.2)' : 'none',
                  }}
                >
                  🌧️ 雨雲
                </button>
                {/* Weather refresh */}
                <button
                  onClick={() => {
                    setRefreshing(true)
                    setWeatherRefreshKey(k => k + 1)
                    setTimeout(() => setRefreshing(false), 1500)
                  }}
                  disabled={refreshing}
                  title="天気データを更新"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(6,10,16,0.72)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: refreshing ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <svg
                    viewBox="0 0 16 16" width="13" height="13"
                    fill="none" stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ animation: refreshing ? 'spinRefresh 0.8s linear infinite' : 'none' }}
                  >
                    <path d="M13.5 8A5.5 5.5 0 1 1 10 3.07"/>
                    <polyline points="10,1 10,4 13,4"/>
                  </svg>
                  <style>{`@keyframes spinRefresh { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
                </button>
                <AccountMenu />
              </div>
            </div>

            {/* Search pin action bar */}
            {searchPin && (
              <div style={{
                position: 'absolute', top: 62, left: '50%', transform: 'translateX(-50%)',
                zIndex: 20,
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(8,12,22,0.94)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(96,165,250,0.35)', borderRadius: 12,
                padding: '8px 12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(96,165,250,0.1)',
                animation: 'fadeSlideDown 0.22s ease both',
              }}>
                <style>{`@keyframes fadeSlideDown{from{opacity:0;transform:translateX(-50%) translateY(-6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 6px #60a5fa', flexShrink: 0 }}/>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {searchPin.label}
                </span>
                <button
                  onClick={() => { setPending({ lat: searchPin.lat, lng: searchPin.lng }); setShowModal(true); setSearchPin(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 11px', borderRadius: 8,
                    background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)',
                    color: '#60a5fa', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(96,165,250,0.28)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(96,165,250,0.15)' }}
                >
                  ＋ ここにポイントを追加
                </button>
                <button
                  onClick={() => setSearchPin(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2, lineHeight: 0 }}
                >
                  <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="2" y1="2" x2="8" y2="8"/><line x1="8" y1="2" x2="2" y2="8"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Bottom gradient */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
              background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
              pointerEvents: 'none', zIndex: 5,
            }}/>

            {/* Right-click context menu */}
            {ctxMenu && (
              <>
                <div
                  style={{ position: 'absolute', inset: 0, zIndex: 50 }}
                  onClick={() => setCtxMenu(null)}
                  onContextMenu={e => { e.preventDefault(); setCtxMenu(null) }}
                />
                <div style={{
                  position: 'absolute',
                  left: Math.min(ctxMenu.x, window.innerWidth - 260),
                  top: Math.min(ctxMenu.y, window.innerHeight - 120),
                  zIndex: 51,
                  background: 'rgba(10,14,22,0.96)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
                  padding: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', minWidth: 220,
                }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '4px 10px 6px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
                    {ctxMenu.lat.toFixed(5)}, {ctxMenu.lng.toFixed(5)}
                  </div>
                  <button
                    onClick={handleCtxAddField}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      width: '100%', padding: '9px 10px', borderRadius: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: '#fff', fontSize: 13, fontWeight: 600, transition: 'background 0.12s', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(62,207,142,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontSize: 16 }}>＋</span>
                    <span>ここに新しいポイントを追加</span>
                  </button>
                  {selectedField && (
                    <button
                      onClick={handleCtxSetLocation}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 9,
                        width: '100%', padding: '9px 10px', borderRadius: 8,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#fff', fontSize: 13, fontWeight: 600, transition: 'background 0.12s', textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: 15 }}>📍</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        「{selectedField.name}」の場所をここに
                      </span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right panel — BestDayMatrix (常時表示) */}
          {fields.some(f => f.lat != null && f.lng != null) && (
            <div style={{
              width: rightPanelWidth, flexShrink: 0, height: '100%', overflow: 'hidden',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              position: 'relative',
            }}>
              {/* 左端リサイズハンドル */}
              <div
                onMouseDown={handleRightResizeMouseDown}
                style={{
                  position: 'absolute', top: 0, left: 0, width: 5, height: '100%',
                  cursor: 'col-resize', zIndex: 20, background: 'transparent',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(62,207,142,0.25)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              />
              <BestDayMatrix allPoints={fields} highlightPointId={selectedField?.id} refreshKey={weatherRefreshKey} plan={plan} />
            </div>
          )}

        </div>{/* end top row */}

        {/* ── Bottom — WeatherDetailPanel (ポイント選択時) ── */}
        {selectedField && (
          <div style={{
            flexShrink: 0, height: bottomPanelHeight, overflow: 'hidden',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            position: 'relative',
          }}>
            {/* 上端リサイズハンドル */}
            <div
              onMouseDown={handleBottomResizeMouseDown}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 5,
                cursor: 'row-resize', zIndex: 20, background: 'transparent',
                borderTop: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(62,207,142,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            />
            <WeatherDetailPanel point={selectedField} onClose={() => setSelected(null)} refreshKey={weatherRefreshKey} plan={plan} />
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════════════
          MOBILE LAYOUT  (hidden on desktop)
      ══════════════════════════════════════════════════ */}
      <div className="sm:hidden" style={{ position: 'absolute', inset: 0 }}>

        {/* Full-screen map */}
        <div style={{ position: 'absolute', inset: 0 }}>{mapViewEl}</div>

        {/* Top gradient */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          pointerEvents: 'none', zIndex: 5,
        }}/>

        {/* Mobile top bar: search + settings */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          zIndex: 10,
        }}>
          <div style={{ flex: 1 }}>
            <MapSearchBox
              mapboxToken={MAPBOX_TOKEN}
              mapCenter={mapCurrentCenter}
              onSelect={handleSearchSelect}
            />
          </div>
          <Link
            href="/settings"
            title="設定"
            style={{
              flexShrink: 0,
              width: 38, height: 38, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(6,10,16,0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="8" cy="8" r="2"/>
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
            </svg>
          </Link>
        </div>

        {/* FAB — add point */}
        <button
          onClick={() => { setPending(null); setShowModal(true) }}
          style={{
            position: 'absolute', bottom: 160, right: 16, zIndex: 25,
            width: 52, height: 52, borderRadius: 26,
            background: 'rgba(62,207,142,0.18)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(62,207,142,0.5)',
            color: '#3ecf8e', fontSize: 28, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 16px rgba(62,207,142,0.2)',
          }}
          title="ポイントを追加"
        >
          ＋
        </button>

        {/* Bottom sheet */}
        <MobileBottomSheet
          snap={mobileSnap}
          onSnapChange={s => {
            setMobileSnap(s)
            if (s === 'list' && mobileSnap === 'detail') {
              // keep selectedField highlighted in list but don't deselect
            }
          }}
          peekContent={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: selectedField ? (selectedField.color ?? '#3ecf8e') : '#3ecf8e',
                boxShadow: `0 0 6px ${selectedField ? (selectedField.color ?? '#3ecf8e') : '#3ecf8e'}`,
                flexShrink: 0,
              }}/>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedField ? selectedField.name : `登録ポイント ${fields.length}件`}
              </span>
              {selectedField && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginLeft: 'auto' }}>
                  ↑ 詳細
                </span>
              )}
            </div>
          }
        >
          {mobileSnap === 'detail' && selectedField
            ? (
              <WeatherDetailPanel
                point={selectedField}
                onClose={() => { setSelected(null); setMobileSnap('list') }}
                refreshKey={weatherRefreshKey}
                plan={plan}
              />
            ) : (
              <PointList
                points={fields}
                selectedPointId={selectedField?.id}
                onPointClick={handleFieldClick}
                onPointEdit={f => setEditingField(f)}
                onAdd={() => { setPending(null); setShowModal(true) }}
              />
            )
          }
        </MobileBottomSheet>
      </div>

      {/* ══════════════════════════════════════════════════
          MODALS  (shared, fixed-position)
      ══════════════════════════════════════════════════ */}
      {showModal && (
        <AddFieldModal
          lat={pendingCoords?.lat}
          lng={pendingCoords?.lng}
          onSave={handleFieldAdded}
          onClose={() => { setShowModal(false); setPending(null) }}
        />
      )}
      {editingField && (
        <EditFieldModal
          field={editingField}
          mapCenter={mapCurrentCenter}
          onSave={handleFieldEdited}
          onClose={() => setEditingField(null)}
          onDelete={handleFieldDeleted}
        />
      )}
    </div>
  )
}
