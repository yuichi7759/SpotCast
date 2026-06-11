'use client'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
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
import MapMediaStrip, { type Media, type Expanded } from '@/components/dashboard/MapMediaStrip'
import OnboardingCard from '@/components/dashboard/OnboardingCard'
import { loadCameras, loadHighlights, CAMERAS_EVENT, HIGHLIGHTS_EVENT } from '@/lib/mediaStripPref'
import AccountMenu from '@/components/layout/AccountMenu'
import { useToast } from '@/components/ToastProvider'
import { createClient } from '@/lib/supabase/client'
import { loadOrder, saveOrder } from '@/lib/spotOrder'
import { loadMarkerZoom } from '@/lib/markerZoomPref'
import { useLocale } from '@/components/LocaleProvider'
import type { IntelligenceEvent } from '@/lib/mockIntelligence'

const FREE_POINT_LIMIT = 3

const MapView = dynamic(() => import('@/components/dashboard/MapView'), { ssr: false })

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export default function DashboardPage() {
  const toast = useToast()
  const { t, locale } = useLocale()

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
  const [mobileSnap,        setMobileSnap]      = useState<SheetSnap>('list')
  const [showRainRadar,     setShowRainRadar]   = useState(false)
  const [weatherRefreshKey, setWeatherRefreshKey] = useState(0)
  const [refreshing,        setRefreshing]       = useState(false)
  const [leftPanelWidth,    setLeftPanelWidth]   = useState(240)
  const [bottomPanelHeight, setBottomPanelHeight] = useState(360)
  const [rightPanelWidth,   setRightPanelWidth]  = useState(420)
  const [plan,              setPlan]             = useState<'free' | 'standard'>('free')
  const [orderIds,          setOrderIds]         = useState<string[]>([])
  const [mobileTab,         setMobileTab]        = useState<'spots' | 'bestday'>('spots')
  const [isMobile,          setIsMobile]         = useState(false)
  const [placingPoint,      setPlacingPoint]     = useState(false)
  const [fitAllNonce,       setFitAllNonce]      = useState(0)
  const [camerasEnabled,    setCamerasEnabled]   = useState(false)
  const [highlightsEnabled, setHighlightsEnabled] = useState(false)
  const [media,             setMedia]            = useState<Media | null>(null)
  const [expandedMedia,     setExpandedMedia]    = useState<Expanded>(null)
  const isResizingRight  = useRef(false)
  const resizeStartXR    = useRef(0)
  const resizeStartWR    = useRef(0)
  const isResizingLeft   = useRef(false)
  const resizeStartX     = useRef(0)
  const resizeStartW     = useRef(0)
  const isResizingBottom = useRef(false)
  const resizeStartY     = useRef(0)
  const resizeStartH     = useRef(0)


  // モバイル判定（flyToオフセット用）
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // ポイント選択時、シートで隠れる分だけ地図を上にずらして「見えている領域の中心」に置く。
  // list(0.56) スナップ基準で、シート高の半分だけ上方向(負)へオフセット。
  const flyOffsetY = isMobile
    ? -Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.56 / 2)
    : 0
  // fitBounds の下パディング（モバイルはシートで隠れる分）
  const fitBottomInset = isMobile
    ? Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.56)
    : 0

  // 全ポイントが地図に収まるよう自動ズーム
  function fitAllSpots() {
    const withCoords = fields.filter(f => f.lat != null && f.lng != null)
    if (withCoords.length === 0) {
      toast.info(t('dash.fitAllEmpty'))
      return
    }
    if (isMobile) setMobileSnap('list')   // 地図を見える状態に
    setFitAllNonce(n => n + 1)
  }

  const loadFields = useCallback(async () => {
    try {
      const res = await fetch('/api/fields')
      if (res.ok) setFields(await res.json())
    } catch {}
    setLoadingFields(false)
  }, [])
  useEffect(() => { loadFields() }, [loadFields])

  // メディア表示の設定（カメラ/見どころ別々・デフォルトOFF。設定変更を購読）
  useEffect(() => {
    setCamerasEnabled(loadCameras()); setHighlightsEnabled(loadHighlights())
    const hc = (e: Event) => setCamerasEnabled((e as CustomEvent).detail as boolean)
    const hh = (e: Event) => setHighlightsEnabled((e as CustomEvent).detail as boolean)
    window.addEventListener(CAMERAS_EVENT, hc)
    window.addEventListener(HIGHLIGHTS_EVENT, hh)
    return () => { window.removeEventListener(CAMERAS_EVENT, hc); window.removeEventListener(HIGHLIGHTS_EVENT, hh) }
  }, [])

  // ライブカメラは Standard 限定（無料プランは Windy API を叩かない＝コスト保護）
  const camerasActive = camerasEnabled && plan === 'standard'

  // 選択ポイント近くのカメラ／見どころを取得（各条件ONかつ座標あり時のみ）
  useEffect(() => {
    setExpandedMedia(null)
    const lat = selectedField?.lat, lng = selectedField?.lng
    if ((!camerasActive && !highlightsEnabled) || lat == null || lng == null) { setMedia(null); return }
    let cancelled = false
    Promise.all([
      camerasActive     ? fetch(`/api/webcams?lat=${lat}&lng=${lng}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
      highlightsEnabled ? fetch(`/api/nearby?lat=${lat}&lng=${lng}&lang=${locale}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
    ]).then(([w, p]) => { if (!cancelled) setMedia({ cams: w?.webcams ?? [], places: p?.places ?? [] }) })
    return () => { cancelled = true }
  }, [selectedField, camerasActive, highlightsEnabled, locale])

  // 地図ピン（カメラ＝青/見どころ＝アンバー、番号でワイプと対応）
  const mediaPins = useMemo(() => {
    if (!media) return []
    return [
      ...media.cams.map((c, i) => ({ key: `cam:${c.id}`, kind: 'cam' as const, lat: c.lat, lng: c.lng, n: i + 1 })),
      ...media.places.map((p, i) => ({ key: `place:${i}`, kind: 'place' as const, lat: p.lat, lng: p.lon, n: i + 1 })),
    ]
  }, [media])

  function handleMediaPinClick(key: string) {
    if (!media) return
    if (key.startsWith('cam:')) {
      const id = Number(key.slice(4))
      const i = media.cams.findIndex(c => c.id === id)
      if (i >= 0) setExpandedMedia({ kind: 'cam', n: i + 1, item: media.cams[i] })
    } else {
      const i = Number(key.slice(6))
      const p = media.places[i]
      if (p) setExpandedMedia({ kind: 'place', n: i + 1, item: p })
    }
  }

  // スポット並び順をロード
  useEffect(() => { setOrderIds(loadOrder()) }, [])
  function handleReorder(ids: string[]) {
    setOrderIds(ids)
    saveOrder(ids)
  }

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
    if (plan === 'free' && fields.length >= FREE_POINT_LIMIT) {
      setCtxMenu(null)
      toast.info(t('dash.freeLimit', { n: FREE_POINT_LIMIT }), t('dash.freeLimitSub'))
      return
    }
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
        toast.success(t('dash.locUpdated', { name: updated.name }))
      }
    } catch {
      toast.info(t('dash.locUpdateFail'))
    }
  }

  function handleFieldClick(field: Field) {
    setSelected(field)
    setSelectedEvent(null)
    if (field.lat != null && field.lng != null) {
      setCenter([field.lng, field.lat])
      setZoom(loadMarkerZoom())
    }
    // モバイル：ポイント選択時は中段(list)に展開。マップ上半分は見えたまま、
    // 詳細はシート内スクロールで気温/降水グラフまで確認できる（detailにすると地図が隠れる）。
    setMobileSnap(prev => (prev === 'detail' ? 'detail' : 'list'))
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
    toast.success(t('dash.updated', { name: updated.name }))
  }

  function handleFieldDeleted(id: string) {
    setFields(prev => prev.filter(f => f.id !== id))
    setEditingField(null)
    if (selectedField?.id === id) setSelected(null)
    toast.info(t('dash.deleted'))
  }

  function handleFieldAdded(field: Field) {
    setFields(prev => [field, ...prev])
    setShowModal(false); setPending(null)
    handleFieldClick(field)
    toast.success(t('dash.added', { name: field.name }), t('dash.addedSub'))
  }

  function handleAddClick() {
    if (plan === 'free' && fields.length >= FREE_POINT_LIMIT) {
      toast.info(t('dash.freeLimit', { n: FREE_POINT_LIMIT }), t('dash.freeLimitSub'))
      return
    }
    setPending(null); setShowModal(true)
  }

  // ── モバイル: ＋ で「地図中央のピンで位置決め」モードに入る ──
  function startPlacingPoint() {
    if (plan === 'free' && fields.length >= FREE_POINT_LIMIT) {
      toast.info(t('dash.freeLimit', { n: FREE_POINT_LIMIT }), t('dash.freeLimitSub'))
      return
    }
    setSelected(null)
    setMobileSnap('peek')   // 地図をほぼ全画面にして位置を合わせやすく
    setPlacingPoint(true)
  }
  function confirmPlacePoint() {
    const c = mapCurrentCenter ?? mapCenter ?? [139.6917, 35.6895]
    setPlacingPoint(false)
    setPending({ lat: c[1], lng: c[0] })
    setShowModal(true)
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
      flyOffsetY={flyOffsetY}
      radarPlayerBottom={isMobile ? 'calc(84px + 10px + env(safe-area-inset-bottom))' : '0'}
      fitAllNonce={fitAllNonce}
      fitBottomInset={fitBottomInset}
      mediaPins={mediaPins}
      onMediaPinClick={handleMediaPinClick}
    />
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--dash-base)' }}>

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
              orderIds={orderIds}
              onReorder={handleReorder}
              onFitAll={fitAllSpots}
            />
            {/* Resize handle */}
            <div
              onMouseDown={handleLeftResizeMouseDown}
              style={{
                position: 'absolute', top: 0, right: 0, width: 5, height: '100%',
                cursor: 'col-resize', zIndex: 20,
                background: 'transparent',
                borderRight: '1px solid var(--dash-border)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(62,207,142,0.25)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            />
          </div>

          {/* Center — Map + overlays */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

            {/* Map */}
            <div style={{ position: 'absolute', inset: 0 }}>{mapViewEl}</div>

            {/* 選択ポイント近くのライブカメラ＋見どころ（地図下部の帯） */}
            {(camerasActive || highlightsEnabled) && (
              <MapMediaStrip media={media} expanded={expandedMedia} onExpand={setExpandedMedia} />
            )}

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
                  onClick={fitAllSpots}
                  title={t('dash.fitAll')}
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
                  {loadingFields ? t('dash.loading') : t('dash.pointCount', { n: fields.length })}
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
                      toast.info(t('dash.radarLocked'), t('dash.radarLockedSub'))
                      return
                    }
                    setShowRainRadar(p => !p)
                  }}
                  title={showRainRadar ? t('dash.radarHide') : t('dash.radarShow')}
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
                  🌧️ {t('dash.radar')}
                </button>
                {/* Weather refresh */}
                <button
                  onClick={() => {
                    setRefreshing(true)
                    setWeatherRefreshKey(k => k + 1)
                    setTimeout(() => setRefreshing(false), 1500)
                  }}
                  disabled={refreshing}
                  title={t('dash.refresh')}
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
                  onClick={() => {
                    if (plan === 'free' && fields.length >= FREE_POINT_LIMIT) {
                      toast.info(t('dash.freeLimit', { n: FREE_POINT_LIMIT }), t('dash.freeLimitSub'))
                      return
                    }
                    setPending({ lat: searchPin.lat, lng: searchPin.lng }); setShowModal(true); setSearchPin(null)
                  }}
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
                  ＋ {t('dash.addHere')}
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
                    <span>{t('dash.ctxAddNew')}</span>
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
                        {t('dash.ctxSetLoc', { name: selectedField.name })}
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
              borderLeft: '1px solid var(--dash-border)',
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
              <BestDayMatrix allPoints={fields} highlightPointId={selectedField?.id} refreshKey={weatherRefreshKey} plan={plan} orderIds={orderIds} />
            </div>
          )}

        </div>{/* end top row */}

        {/* ── Bottom — WeatherDetailPanel (ポイント選択時) ── */}
        {selectedField && (
          <div style={{
            flexShrink: 0, height: bottomPanelHeight, overflow: 'hidden',
            borderTop: '1px solid var(--dash-border)',
            position: 'relative',
          }}>
            {/* 上端リサイズハンドル */}
            <div
              onMouseDown={handleBottomResizeMouseDown}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 5,
                cursor: 'row-resize', zIndex: 20, background: 'transparent',
                borderTop: '1px solid var(--dash-border)',
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

        {/* 選択ポイント近くのライブカメラ＋見どころ（シートの上に帯／詳細展開・位置決め中は隠す） */}
        {(camerasActive || highlightsEnabled) && !placingPoint && mobileSnap !== 'detail' && (
          <MapMediaStrip
            media={media}
            expanded={expandedMedia}
            onExpand={setExpandedMedia}
            bottomOffset={mobileSnap === 'peek'
              ? 'calc(84px + 8px + env(safe-area-inset-bottom))'
              : 'calc(56dvh + 8px + env(safe-area-inset-bottom))'}
          />
        )}

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
          {/* 雨雲レーダー トグル（スマホ用） */}
          <button
            onClick={() => {
              if (plan === 'free') { toast.info(t('dash.radarLocked'), t('dash.radarLockedSub')); return }
              setShowRainRadar(p => {
                const next = !p
                if (next) setMobileSnap('peek')   // レーダー再生バーが見えるようシートを畳む
                return next
              })
            }}
            title={showRainRadar ? t('dash.radarHide') : t('dash.radarShow')}
            style={{
              flexShrink: 0,
              width: 38, height: 38, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showRainRadar ? 'rgba(96,165,250,0.25)' : 'rgba(6,10,16,0.75)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${showRainRadar ? 'rgba(96,165,250,0.55)' : 'rgba(255,255,255,0.12)'}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)', cursor: 'pointer', fontSize: 18, lineHeight: 1,
            }}
          >
            🌧️
          </button>
          <Link
            href="/settings"
            title={t('settings.title')}
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
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Link>
        </div>

        {/* FAB — add point. シートの上端に追従させ、詳細展開・位置決め中は隠す。 */}
        <button
          onClick={startPlacingPoint}
          style={{
            position: 'absolute',
            bottom: mobileSnap === 'peek' ? 'calc(84px + 14px + env(safe-area-inset-bottom))' : 'calc(56dvh + 14px + env(safe-area-inset-bottom))',
            right: 16, zIndex: 25,
            width: 52, height: 52, borderRadius: 26,
            background: 'rgba(62,207,142,0.22)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(62,207,142,0.55)',
            color: '#3ecf8e', fontSize: 28, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 16px rgba(62,207,142,0.2)',
            opacity: (mobileSnap === 'detail' || placingPoint) ? 0 : 1,
            pointerEvents: (mobileSnap === 'detail' || placingPoint) ? 'none' : 'auto',
            transition: 'bottom 0.30s cubic-bezier(0.32,0.72,0,1), opacity 0.2s',
          }}
          title={t('dash.addPoint')}
        >
          ＋
        </button>

        {/* ── 位置決めモード: 中央の半透明ピン + ヒント + 確定バー ── */}
        {placingPoint && (
          <>
            {/* 中央ピン（タップ透過。先端=地図コンテナ中心(top50%)=map.getCenter()と一致） */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -100%)', zIndex: 26,
              pointerEvents: 'none', textAlign: 'center',
              animation: 'placePinBob 1.8s ease-in-out infinite',
            }}>
              <style>{`
                @keyframes placePinBob { 0%,100%{transform:translate(-50%,-100%)} 50%{transform:translate(-50%,calc(-100% - 6px))} }
                @keyframes placeRing { 0%{transform:translate(-50%,-50%) scale(.6);opacity:.7} 100%{transform:translate(-50%,-50%) scale(1.8);opacity:0} }
              `}</style>
              <svg width="40" height="52" viewBox="0 0 40 52" fill="none" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>
                <path d="M20 2C10.6 2 3 9.6 3 19c0 12 17 29 17 29s17-17 17-29C37 9.6 29.4 2 20 2z"
                  fill="rgba(62,207,142,0.55)" stroke="#3ecf8e" strokeWidth="2"/>
                <circle cx="20" cy="19" r="6.5" fill="#0a0e16"/>
                <line x1="20" y1="14.5" x2="20" y2="23.5" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round"/>
                <line x1="15.5" y1="19" x2="24.5" y2="19" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {/* 先端の地面リング（地図中心を明示＝実際に保存される地点） */}
            <div style={{ position: 'absolute', left: '50%', top: '50%', zIndex: 25, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', width: 26, height: 26, borderRadius: '50%', border: '2px solid rgba(62,207,142,0.7)', animation: 'placeRing 1.6s ease-out infinite' }}/>
              <div style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: '#3ecf8e', transform: 'translate(-50%,-50%)', boxShadow: '0 0 6px #3ecf8e' }}/>
            </div>

            {/* ヒントピル（上部） */}
            <div style={{
              position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 27,
              background: 'rgba(8,12,22,0.92)', backdropFilter: 'blur(14px)',
              border: '1px solid rgba(62,207,142,0.35)', borderRadius: 999,
              padding: '7px 14px', fontSize: 12.5, fontWeight: 600, color: '#d1fae5',
              whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}>
              📍 {t('dash.placeHint')}
            </div>

            {/* 確定バー（下部） */}
            <div style={{
              position: 'absolute', left: 12, right: 12,
              bottom: 'calc(16px + env(safe-area-inset-bottom))', zIndex: 27,
              display: 'flex', gap: 10,
            }}>
              <button
                onClick={() => setPlacingPoint(false)}
                style={{
                  flex: '0 0 auto', padding: '14px 18px', borderRadius: 14,
                  background: 'rgba(20,24,34,0.92)', backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.75)',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmPlacePoint}
                style={{
                  flex: 1, padding: '14px 18px', borderRadius: 14,
                  background: '#3ecf8e', border: '1px solid #3ecf8e', color: '#06281a',
                  fontSize: 15, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(62,207,142,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                📍 {t('dash.addHere')}
              </button>
            </div>
          </>
        )}

        {/* Bottom sheet（位置決め中は隠す） */}
        {!placingPoint && (
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
                {selectedField ? selectedField.name : t('dash.pointCount', { n: fields.length })}
              </span>
              {selectedField && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginLeft: 'auto' }}>
                  {t('dash.detail')}
                </span>
              )}
            </div>
          }
        >
          {selectedField
            ? (
              <WeatherDetailPanel
                point={selectedField}
                onClose={() => { setSelected(null); setMobileSnap('list') }}
                refreshKey={weatherRefreshKey}
                plan={plan}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* タブ切替: スポット / ベストデイ */}
                <div style={{ display: 'flex', gap: 6, padding: '4px 12px 10px', flexShrink: 0 }}>
                  {([['spots', 'My Spots'], ['bestday', 'Best Day']] as const).map(([id, label]) => {
                    const active = mobileTab === id
                    return (
                      <button
                        key={id}
                        // My Spots タップで全ポイントを地図に収める（タブ切替も兼ねる）
                        onClick={() => { setMobileTab(id); if (id === 'spots') fitAllSpots() }}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 9,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          background: active ? 'var(--dash-accent-bg)' : 'var(--dash-surface)',
                          border: `1px solid ${active ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                          color: active ? 'var(--dash-accent)' : 'var(--dash-text-3)',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        {label}
                        {id === 'spots' && (
                          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"/>
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  {mobileTab === 'spots' ? (
                    <PointList
                      points={fields}
                      selectedPointId={undefined}
                      onPointClick={handleFieldClick}
                      onPointEdit={f => setEditingField(f)}
                      onAdd={handleAddClick}
                      orderIds={orderIds}
                      onReorder={handleReorder}
                      hideHeader
                    />
                  ) : (
                    <BestDayMatrix allPoints={fields} highlightPointId={undefined} refreshKey={weatherRefreshKey} plan={plan} orderIds={orderIds} />
                  )}
                </div>
              </div>
            )
          }
        </MobileBottomSheet>
        )}
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

      {/* 初回ログイン時の使い方カード */}
      <OnboardingCard />
    </div>
  )
}
