'use client'
import { useEffect, useRef, useState } from 'react'
import type { Field } from '@/types/field'
import { calcFieldStatus } from '@/lib/fieldStatus'
import type { IntelligenceEvent } from '@/lib/mockIntelligence'
import { EVENT_CFG, SEVERITY_CFG } from '@/lib/mockIntelligence'

interface Props {
  fields: Field[]
  intelligenceEvents?: IntelligenceEvent[]
  selectedEventId?: string | null
  selectedFieldId?: string | null
  searchPin?: { lng: number; lat: number } | null
  onMapClick?: (lat: number, lng: number) => void
  onMapRightClick?: (lat: number, lng: number, x: number, y: number) => void
  onFieldClick: (field: Field) => void
  onIntelClick?: (ev: IntelligenceEvent) => void
  onMoveEnd?: (center: [number, number]) => void
  center?: [number, number]
  zoom?: number
  drawingMode?: boolean
  drawingPoints?: [number, number][]   // controlled from outside
  onPointAdd?: (coord: [number, number]) => void
  onPolygonClose?: () => void          // user clicked near first vertex (auto-close)
  showRainRadar?: boolean
}

export default function MapView({
  fields, intelligenceEvents = [], selectedEventId, selectedFieldId,
  searchPin,
  onMapClick, onMapRightClick, onFieldClick, onIntelClick, onMoveEnd, center, zoom,
  drawingMode, drawingPoints, onPointAdd, onPolygonClose,
  showRainRadar = false,
}: Props) {
  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const [radarTime,  setRadarTime]  = useState<Date | null>(null)
  const [frames,     setFrames]     = useState<Array<{ time: number; path: string }>>([])
  const [frameIndex, setFrameIndex] = useState(0)
  const [isPlaying,  setIsPlaying]  = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef       = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mglRef       = useRef<any>(null)                          // mapboxgl module
  const fieldMkrsRef  = useRef<any[]>([])           // 旧HTML marker refs（削除予定）
  const fieldElemsRef = useRef<Map<string, HTMLElement>>(new Map())
  const fieldPopupRef = useRef<any>(null)           // 現在表示中のfield popup
  const intelMkrsRef  = useRef<any[]>([])
  const intelElemsRef = useRef<Map<string, HTMLElement>>(new Map())
  const pendingFly     = useRef<{ center: [number,number]; zoom: number } | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchPinMkrRef = useRef<any>(null)
  // Refs that are always up-to-date — safe to read inside stale closures (map.on('load') etc.)
  const fieldsRef         = useRef<Field[]>(fields)
  const intelligenceRef   = useRef<IntelligenceEvent[]>(intelligenceEvents)
  const onFieldClickRef   = useRef(onFieldClick)
  const onIntelClickRef   = useRef(onIntelClick)
  const selectedFieldIdRef = useRef(selectedFieldId)
  const drawingModeRef    = useRef(false)
  const drawingPointsRef  = useRef<[number, number][]>([])
  const previewPtRef      = useRef<[number, number] | null>(null)
  const onPointAddRef     = useRef(onPointAdd)
  const onPolygonCloseRef = useRef(onPolygonClose)

  // Always keep refs in sync with latest props
  fieldsRef.current         = fields
  intelligenceRef.current   = intelligenceEvents
  onFieldClickRef.current   = onFieldClick
  onIntelClickRef.current   = onIntelClick
  selectedFieldIdRef.current = selectedFieldId
  drawingModeRef.current    = !!drawingMode
  drawingPointsRef.current  = drawingPoints ?? []
  onPointAddRef.current     = onPointAdd
  onPolygonCloseRef.current = onPolygonClose

  // ── Helper: update draw sources ──────────────────────────
  function updateDrawSources(pts: [number, number][], preview: [number, number] | null) {
    const map = mapRef.current
    if (!map) return
    const all = preview ? [...pts, preview] : pts
    const closed = all.length >= 2 ? [...all, all[0]] : all

    ;(map.getSource('draw-poly-src') as any)?.setData({
      type: 'FeatureCollection',
      features: all.length >= 3 ? [{
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [closed] },
        properties: {},
      }] : [],
    })
    ;(map.getSource('draw-line-src') as any)?.setData({
      type: 'FeatureCollection',
      features: all.length >= 2 ? [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: all },
        properties: {},
      }] : [],
    })
    ;(map.getSource('draw-verts-src') as any)?.setData({
      type: 'FeatureCollection',
      features: pts.map((p, i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: p },
        properties: { index: i },
      })),
    })
  }

  // ── Helper: cleanup draw layers ──────────────────────────
  function cleanupDrawLayers() {
    const map = mapRef.current
    if (!map) return
    ;['draw-verts-first', 'draw-verts', 'draw-line', 'draw-outline', 'draw-fill'].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id)
    })
    ;['draw-poly-src', 'draw-line-src', 'draw-verts-src'].forEach(id => {
      if (map.getSource(id)) map.removeSource(id)
    })
    map.getCanvas().style.cursor = ''
  }

  // ── 1. Init map (once) ──────────────────────────────────────
  useEffect(() => {
    if (!mapToken || !containerRef.current) return
    let cancelled = false

    import('mapbox-gl').then(mod => {
      if (cancelled || mapRef.current) return

      // Inject CSS — バージョンをインストール済み v3.24.0 に合わせる
      const existingCss = document.getElementById('mapbox-gl-css') as HTMLLinkElement | null
      if (!existingCss) {
        const link = document.createElement('link')
        link.id   = 'mapbox-gl-css'
        link.rel  = 'stylesheet'
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.24.0/mapbox-gl.css'
        document.head.appendChild(link)
      } else if (!existingCss.href.includes('v3.24')) {
        // 古いバージョンのCSSが残っていたら差し替え
        existingCss.href = 'https://api.mapbox.com/mapbox-gl-js/v3.24.0/mapbox-gl.css'
      }
      if (!document.getElementById('cropai-marker-css')) {
        const s = document.createElement('style')
        s.id = 'cropai-marker-css'
        s.textContent = `
          @keyframes mPulse{0%{box-shadow:0 0 0 0px currentColor}70%{box-shadow:0 0 0 10px transparent}100%{box-shadow:0 0 0 10px transparent}}
          @keyframes iPulse{0%{box-shadow:0 0 0 0px currentColor}70%{box-shadow:0 0 0 14px transparent}100%{box-shadow:0 0 0 14px transparent}}
          .cropai-popup .mapboxgl-popup-content{background:rgba(8,12,18,.94)!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:14px!important;padding:14px 18px!important;box-shadow:0 8px 32px rgba(0,0,0,.5)!important;min-width:200px}
          .cropai-popup .mapboxgl-popup-tip{border-top-color:rgba(8,12,18,.94)!important}
          .cropai-popup .mapboxgl-popup-close-button{color:rgba(255,255,255,.4)!important;font-size:18px}
        `
        document.head.appendChild(s)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mgl = (mod.default ?? mod) as any
      mgl.accessToken = mapToken
      mglRef.current  = mgl

      const map = new mgl.Map({
        container: containerRef.current!,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: center ?? [136.7, 35.7],
        zoom:   zoom   ?? 5,
        projection: { name: 'mercator' },  // Globe投影だとズームで南にズレる
        attributionControl: false,
        antialias: true,
      })

      map.addControl(new mgl.NavigationControl({ showCompass: false }), 'bottom-right')
      map.addControl(new mgl.AttributionControl({ compact: true }),     'bottom-left')
      map.addControl(new mgl.ScaleControl({ maxWidth: 80, unit: 'metric' }), 'bottom-left')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on('click', (e: any) => {
        if (drawingModeRef.current) return   // handled by drawing mode effect
        onMapClick?.(e.lngLat.lat, e.lngLat.lng)
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on('contextmenu', (e: any) => {
        e.preventDefault?.()
        onMapRightClick?.(e.lngLat.lat, e.lngLat.lng, e.point.x, e.point.y)
      })
      map.on('moveend', ()       => {
        const c = map.getCenter()
        onMoveEnd?.([c.lng, c.lat])
      })
      mapRef.current = map

      map.on('load', () => {
        // v3 のデフォルトは Globe 投影。WebGL レイヤーも Globe だとズームで
        // 緯度の高い地点が南にズレる。Mercator に固定する。
        // 正しい構文は文字列ではなくオブジェクト: { name: 'mercator' }
        try { map.setProjection({ name: 'mercator' }) } catch (e) { console.warn('setProjection failed', e) }

        rebuildFieldMarkers()
        rebuildIntelMarkers()
        if (pendingFly.current) {
          map.flyTo({ ...pendingFly.current, speed: 1.5, curve: 1.2 })
          pendingFly.current = null
        }
      })

      // RainViewer tiles only go to z=12. Suppress the "zoom level not supported"
      // error that Mapbox GL JS fires when it tries to render beyond maxzoom.
      // The layer keeps rendering via overzoom; this is purely a console noise issue.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on('error', (e: any) => {
        const msg: string = e?.error?.message ?? ''
        if (msg.toLowerCase().includes('zoom level') || msg.toLowerCase().includes('not supported')) return
        console.error('[MapView]', e?.error ?? e)
      })

      // スタイルが再ロードされたときも Mercator を維持
      map.on('style.load', () => {
        try { map.setProjection({ name: 'mercator' }) } catch (e) { console.warn('setProjection failed', e) }
      })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      mglRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapToken])

  // ── 2. FlyTo when center changes ───────────────────────────
  useEffect(() => {
    if (!center) return
    const target = { center, zoom: zoom ?? 15 }
    const map = mapRef.current
    if (!map) { pendingFly.current = target; return }
    try {
      map.flyTo({ ...target, speed: 1.5, curve: 1.2 })
    } catch {
      pendingFly.current = target
    }
  }, [center, zoom])

  // ── 3. Rebuild field markers when fields change ────────────
  useEffect(() => {
    rebuildFieldMarkers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields])

  // ── 4. Rebuild intel markers when events change ────────────
  useEffect(() => {
    rebuildIntelMarkers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intelligenceEvents])

  // ── 4b-rain. RainViewer 雨雲レーダー overlay ──────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const LAYER_PFX  = 'rainviewer-layer-'
    const SOURCE_PFX = 'rainviewer-src-'
    const MAX_FRAMES = 20   // 念のため上限

    function removeRadar() {
      for (let i = 0; i < MAX_FRAMES; i++) {
        try { if (map.getLayer(LAYER_PFX + i))  map.removeLayer(LAYER_PFX + i)  } catch {}
        try { if (map.getSource(SOURCE_PFX + i)) map.removeSource(SOURCE_PFX + i) } catch {}
      }
    }

    function addRadar() {
      if (!map.isStyleLoaded()) return
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(r => r.json())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((data: any) => {
          const past: any[] = data?.radar?.past ?? []
          if (!past.length) return

          // 時刻昇順（古い→新しい）でソート
          const sorted = [...past].sort((a, b) => a.time - b.time)
          const latestIdx = sorted.length - 1

          setFrames(sorted)
          setFrameIndex(latestIdx)
          setRadarTime(new Date((sorted[latestIdx].time as number) * 1000))

          removeRadar()
          const origin = window.location.origin
          const beforeLayer = map.getLayer('field-glow') ? 'field-glow' : undefined

          // 全フレームをソース+レイヤーとして一括追加。
          // 最新フレームだけ opacity=0.65、それ以外は 0。
          // → タイルは全フレーム分がバックグラウンドでロードされるので
          //   フレーム切り替え時は setPaintProperty だけで瞬時に切り替え可能。
          sorted.forEach((frame, idx) => {
            map.addSource(SOURCE_PFX + idx, {
              type: 'raster',
              tiles: [`${origin}/api/radar/tile/{z}/{x}/{y}?p=${encodeURIComponent(frame.path as string)}`],
              tileSize: 256,
              minzoom: 0,
              maxzoom: 12,   // proxy crops/upscales z>7; source cap prevents "zoom not supported" errors
              attribution: idx === 0 ? '© RainViewer' : '',
            })
            map.addLayer({
              id:    LAYER_PFX + idx,
              type:  'raster',
              source: SOURCE_PFX + idx,
              maxzoom: 24,   // render layer at all zoom levels (overzoom from maxzoom:12 tiles)
              paint: {
                'raster-opacity': idx === latestIdx ? 0.65 : 0,
                'raster-fade-duration': 0,   // フェードなし → 即時切り替え
              },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any, beforeLayer)
          })
        })
        .catch(err => console.warn('[RainViewer]', err))
    }

    if (!showRainRadar) {
      removeRadar()
      setRadarTime(null)
      setFrames([])
      setFrameIndex(0)
      setIsPlaying(false)
      return
    }

    // スタイルロード済みなら即追加、未ロードなら load イベント後に追加
    if (map.isStyleLoaded()) {
      addRadar()
    } else {
      map.once('style.load', addRadar)
    }

    return () => {
      map.off('style.load', addRadar)
      removeRadar()
      setFrames([])
      setFrameIndex(0)
      setIsPlaying(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRainRadar])

  // ── 4c. フレーム切り替え（opacity のみ変更 → 瞬時切り替え）────
  useEffect(() => {
    if (!frames.length) return
    const map = mapRef.current
    if (!map) return
    frames.forEach((_, idx) => {
      const layId = 'rainviewer-layer-' + idx
      if (map.getLayer(layId)) {
        map.setPaintProperty(layId, 'raster-opacity', idx === frameIndex ? 0.65 : 0)
      }
    })
    setRadarTime(new Date(frames[frameIndex].time * 1000))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIndex, frames])

  // ── 4d. 自動再生 ─────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return
    const id = setInterval(() => {
      setFrameIndex(prev => (prev + 1 >= frames.length ? 0 : prev + 1))
    }, 1200)
    return () => clearInterval(id)
  }, [isPlaying, frames.length])

  // ── 4b. Search pin marker ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    const mgl = mglRef.current
    // Remove previous pin
    if (searchPinMkrRef.current) {
      searchPinMkrRef.current.remove()
      searchPinMkrRef.current = null
    }
    if (!map || !mgl || !searchPin) return

    // Inject searchPin CSS once
    if (!document.getElementById('cropai-searchpin-css')) {
      const s = document.createElement('style')
      s.id = 'cropai-searchpin-css'
      s.textContent = `
        @keyframes pinDrop{0%{transform:translateY(-18px) scale(0.7);opacity:0}70%{transform:translateY(4px) scale(1.05)}100%{transform:translateY(0) scale(1);opacity:1}}
        @keyframes pinRing{0%{transform:scale(0.6);opacity:.8}100%{transform:scale(2.4);opacity:0}}
      `
      document.head.appendChild(s)
    }

    const wrap = document.createElement('div')
    wrap.style.cssText = 'position:relative;width:30px;height:38px;pointer-events:none'

    // Ripple ring at base
    const ring = document.createElement('div')
    ring.style.cssText = `
      position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);
      width:18px;height:18px;border-radius:50%;
      border:2px solid #60a5fa;
      animation:pinRing 1.6s ease-out infinite;
    `
    wrap.appendChild(ring)

    // Shadow ellipse
    const shadow = document.createElement('div')
    shadow.style.cssText = `
      position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
      width:12px;height:5px;border-radius:50%;
      background:rgba(0,0,0,0.35);
    `
    wrap.appendChild(shadow)

    // Pin body
    const pin = document.createElement('div')
    pin.style.cssText = `
      position:absolute;top:0;left:50%;transform:translateX(-50%);
      width:26px;height:34px;
      animation:pinDrop 0.35s cubic-bezier(0.22,1,0.36,1) both;
    `
    pin.innerHTML = `
      <svg viewBox="0 0 26 34" width="26" height="34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 0C7.477 0 3 4.477 3 10c0 7 10 21 10 21s10-14 10-21C23 4.477 18.523 0 13 0z"
          fill="#60a5fa" stroke="#fff" stroke-width="1.5"/>
        <circle cx="13" cy="10" r="4" fill="#fff" opacity="0.95"/>
      </svg>
    `
    wrap.appendChild(pin)

    const marker = new mgl.Marker({ element: wrap, anchor: 'bottom' })
      .setLngLat([searchPin.lng, searchPin.lat])
      .addTo(map)

    searchPinMkrRef.current = marker
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchPin])

  // ── 5. Highlight selected intel marker ─────────────────────
  useEffect(() => {
    intelElemsRef.current.forEach((el, id) => {
      el.style.transform = id === selectedEventId ? 'scale(1.5)' : 'scale(1)'
      el.style.zIndex    = id === selectedEventId ? '9' : '0'
    })
  }, [selectedEventId])

  // ── 6. Highlight selected field marker ─────────────────────
  useEffect(() => {
    // GeoJSON を再描画して selected プロパティを反映
    rebuildFieldMarkers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFieldId])

  // ── Drawing mode ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    const mgl = mglRef.current
    if (!map || !mgl) {
      if (!drawingMode) cleanupDrawLayers()
      return
    }

    if (!drawingMode) {
      cleanupDrawLayers()
      previewPtRef.current = null
      return
    }

    // ── Setup sources & layers ──
    const SRCS: Array<[string, object]> = [
      ['draw-poly-src',  { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }],
      ['draw-line-src',  { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }],
      ['draw-verts-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }],
    ]
    SRCS.forEach(([id, def]) => { if (!map.getSource(id)) map.addSource(id, def as any) })

    if (!map.getLayer('draw-fill')) {
      map.addLayer({ id: 'draw-fill', type: 'fill', source: 'draw-poly-src',
        paint: { 'fill-color': '#3ecf8e', 'fill-opacity': 0.12 } })
    }
    if (!map.getLayer('draw-outline')) {
      map.addLayer({ id: 'draw-outline', type: 'line', source: 'draw-poly-src',
        paint: { 'line-color': '#3ecf8e', 'line-width': 2 } })
    }
    if (!map.getLayer('draw-line')) {
      map.addLayer({ id: 'draw-line', type: 'line', source: 'draw-line-src',
        paint: { 'line-color': 'rgba(255,255,255,0.7)', 'line-width': 1.5, 'line-dasharray': [4, 3] } })
    }
    if (!map.getLayer('draw-verts')) {
      map.addLayer({ id: 'draw-verts', type: 'circle', source: 'draw-verts-src',
        paint: { 'circle-radius': 5, 'circle-color': '#3ecf8e', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } })
    }
    if (!map.getLayer('draw-verts-first')) {
      map.addLayer({ id: 'draw-verts-first', type: 'circle', source: 'draw-verts-src',
        filter: ['==', ['get', 'index'], 0],
        paint: { 'circle-radius': 8, 'circle-color': '#3ecf8e', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2.5 } })
    }

    map.getCanvas().style.cursor = 'crosshair'

    function onClick(e: any) {
      const coord: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      const pts = drawingPointsRef.current
      // Check close-polygon: click near first vertex when 3+ points exist
      if (pts.length >= 3) {
        const fp = map.project(pts[0] as [number, number])
        const cp = map.project([coord[0], coord[1]])
        if (Math.hypot(fp.x - cp.x, fp.y - cp.y) < 18) {
          onPolygonCloseRef.current?.()
          return
        }
      }
      onPointAddRef.current?.(coord)
    }

    function onMove(e: any) {
      previewPtRef.current = [e.lngLat.lng, e.lngLat.lat]
      updateDrawSources(drawingPointsRef.current, previewPtRef.current)
    }

    function onDblClick(e: any) {
      // Prevent zoom on double-click while drawing
      e.preventDefault()
    }

    map.on('click', onClick)
    map.on('mousemove', onMove)
    map.on('dblclick', onDblClick)

    return () => {
      map.off('click', onClick)
      map.off('mousemove', onMove)
      map.off('dblclick', onDblClick)
      cleanupDrawLayers()
      previewPtRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingMode])

  // ── Update draw sources when drawingPoints change ───────────
  useEffect(() => {
    if (!drawingMode) return
    updateDrawSources(drawingPoints ?? [], previewPtRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingPoints, drawingMode])

  // ── Render saved field polygons ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const features = fields
      .filter(f => f.polygon && f.polygon.length >= 3)
      .map(f => ({
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [[...f.polygon!, f.polygon![0]]] },
        properties: { color: f.color ?? '#3ecf8e' },
      }))

    const src = map.getSource('field-polys-src') as any
    if (src) {
      src.setData({ type: 'FeatureCollection', features })
      return
    }
    // Source not yet added — add source + layers
    if (!map.isStyleLoaded()) return
    map.addSource('field-polys-src', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    })
    map.addLayer({
      id: 'field-polys-fill', type: 'fill', source: 'field-polys-src',
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.15 },
    })
    map.addLayer({
      id: 'field-polys-outline', type: 'line', source: 'field-polys-src',
      paint: { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-opacity': 0.7 },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields])

  // ── Helpers ────────────────────────────────────────────────

  // GeoJSON source + WebGL circle layer でフィールドマーカーを描画
  // → HTML マーカーを使わないのでズームによる座標ズレが原理的に起きない
  function rebuildFieldMarkers() {
    const map = mapRef.current
    const mgl = mglRef.current
    if (!map || !mgl || !map.isStyleLoaded()) return

    // GeoJSON データ組み立て
    const features = fieldsRef.current
      .filter(f => f.lat != null && f.lng != null)
      .map(f => {
        const fs    = calcFieldStatus(f)
        const color = f.color ?? fs.color
        return {
          type: 'Feature' as const,
          properties: {
            fieldId:  f.id,
            color,
            name:     f.name,
            crop:     f.crop  ?? '',
            variety:  f.variety ?? '',
            stage:    fs.stage,
            action:   fs.nextAction,
            status:   fs.status,
            selected: f.id === selectedFieldIdRef.current ? 1 : 0,
          },
          geometry: { type: 'Point' as const, coordinates: [f.lng!, f.lat!] },
        }
      })

    const geojson = { type: 'FeatureCollection' as const, features }

    // ── ソース存在済み → データだけ更新 ──
    if (map.getSource('field-pts')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(map.getSource('field-pts') as any).setData(geojson)
      return
    }

    // ── 初回: ソース＋レイヤーを追加 ──
    map.addSource('field-pts', { type: 'geojson', data: geojson })

    // 外側グロー
    map.addLayer({ id: 'field-glow', type: 'circle', source: 'field-pts', paint: {
      'circle-radius':  ['interpolate', ['linear'], ['zoom'], 5, 10, 15, 22],
      'circle-color':   ['get', 'color'],
      'circle-opacity': 0.18,
      'circle-blur':    1,
    }})

    // メインドット
    map.addLayer({ id: 'field-dot', type: 'circle', source: 'field-pts', paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 5, 15, 11],
      'circle-color':  ['get', 'color'],
      'circle-stroke-width': 2,
      'circle-stroke-color': 'rgba(255,255,255,0.92)',
    }})

    // 選択中ドット（外枠リング）
    map.addLayer({ id: 'field-selected', type: 'circle', source: 'field-pts',
      filter: ['==', ['get', 'selected'], 1],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 9, 15, 17],
        'circle-color':  'transparent',
        'circle-stroke-width': 3,
        'circle-stroke-color': 'rgba(255,255,255,0.95)',
        'circle-opacity': 1,
      }
    })

    // クリックイベント
    map.on('click', 'field-dot', (e: any) => {
      e.preventDefault()
      const props = e.features?.[0]?.properties
      if (!props) return
      const field = fieldsRef.current.find(f => f.id === props.fieldId)
      if (!field) return

      // ポップアップ
      if (fieldPopupRef.current) fieldPopupRef.current.remove()
      fieldPopupRef.current = new mgl.Popup({ offset: 14, maxWidth: '240px', className: 'cropai-popup' })
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(`
          <div style="font-family:-apple-system,sans-serif">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">
              <div style="width:10px;height:10px;border-radius:50%;background:${props.color};flex-shrink:0"></div>
              <div style="font-weight:800;font-size:14px;color:#fff">${props.name}</div>
            </div>
            ${props.crop ? `<div style="font-size:13px;color:rgba(255,255,255,.65);margin-bottom:4px">${props.crop}${props.variety ? ` · ${props.variety}` : ''}</div>` : ''}
            <div style="font-size:12px;color:${props.color};font-weight:600;margin-bottom:4px">${props.stage}</div>
            <div style="font-size:12px;color:rgba(255,255,255,.45);line-height:1.5">${props.action}</div>
          </div>`)
        .addTo(map)

      onFieldClickRef.current(field)
    })

    // ホバーカーソル
    map.on('mouseenter', 'field-dot', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'field-dot', () => { map.getCanvas().style.cursor = '' })
  }

  function rebuildIntelMarkers() {
    const map = mapRef.current
    const mgl = mglRef.current
    if (!map || !mgl) return

    intelMkrsRef.current.forEach(m => m.remove())
    intelMkrsRef.current = []
    intelElemsRef.current.clear()

    for (const ev of intelligenceRef.current) {
      const cfg  = EVENT_CFG[ev.type]
      const scfg = SEVERITY_CFG[ev.severity]
      const c    = cfg.color

      const wrap = document.createElement('div')
      wrap.style.cssText = 'position:relative;width:44px;height:44px;cursor:pointer'

      if (ev.severity === 'alert') {
        const ring = document.createElement('div')
        ring.style.cssText = `position:absolute;inset:-8px;border-radius:50%;border:2px solid ${c};animation:iPulse 2.4s ease-out infinite`
        wrap.appendChild(ring)
      }

      const circle = document.createElement('div')
      circle.style.cssText = `
        position:absolute;inset:0;border-radius:50%;
        background:rgba(6,10,16,.92);
        border:2.5px solid ${c};
        box-shadow:0 0 18px ${c}77;
        display:flex;align-items:center;justify-content:center;
        transition:transform .15s;
        font-size:20px;line-height:1;
      `
      circle.textContent = cfg.icon
      wrap.appendChild(circle)

      const sdot = document.createElement('div')
      sdot.style.cssText = `position:absolute;top:0;right:0;width:13px;height:13px;border-radius:50%;background:${scfg.badge};border:2px solid rgba(6,10,16,.95);box-shadow:0 0 8px ${scfg.badge}`
      wrap.appendChild(sdot)

      circle.addEventListener('mouseenter', () => { circle.style.transform = 'scale(1.18)' })
      circle.addEventListener('mouseleave', () => { circle.style.transform = 'scale(1)' })
      intelElemsRef.current.set(ev.id, circle)

      const popup = new mgl.Popup({ offset: 26, maxWidth: '280px', className: 'cropai-popup' })
        .setHTML(`
          <div style="font-family:-apple-system,sans-serif">
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">
              <span style="font-size:22px;flex-shrink:0">${cfg.icon}</span>
              <div>
                <div style="font-size:11px;color:${scfg.badge};font-weight:700;margin-bottom:3px">${SEVERITY_CFG[ev.severity].label} · ${cfg.label}</div>
                <div style="font-weight:800;font-size:15px;color:#fff;line-height:1.25">${ev.title}</div>
              </div>
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,.65);line-height:1.65;margin-bottom:10px">${ev.body}</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,.35)">
              <span>📍 ${ev.region}</span><span>${ev.source}</span>
            </div>
          </div>`)

      const marker = new mgl.Marker({ element: wrap })
        .setLngLat([ev.lng, ev.lat])
        .setPopup(popup)
        .addTo(map)

      wrap.addEventListener('click', e => { e.stopPropagation(); onIntelClickRef.current?.(ev) })
      intelMkrsRef.current.push(marker)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  if (!mapToken) {
    return (
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        background:'linear-gradient(135deg,#0a1628,#0d2137,#0a1a10)', flexDirection:'column', gap:14 }}>
        <div style={{ fontSize:48, opacity:.2 }}>🗺️</div>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:14, color:'rgba(255,255,255,.5)', fontWeight:600, marginBottom:6 }}>Mapboxトークンが必要です</div>
          <code style={{ fontSize:12, color:'#3ecf8e', opacity:.7 }}>NEXT_PUBLIC_MAPBOX_TOKEN</code>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:4 }}>.env.local に追加してください</div>
        </div>
      </div>
    )
  }

  // ── helpers for player ──────────────────────────────────────
  function fmtHHMM(ts: number) {
    const d = new Date(ts * 1000)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* ── 雨雲レーダー タイムプレーヤー ── */}
      {showRainRadar && frames.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
          background: 'rgba(6,10,16,0.90)', backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(96,165,250,0.18)',
          padding: '7px 14px 9px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* 再生/一時停止 */}
          <button
            onClick={() => setIsPlaying(p => !p)}
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: isPlaying ? 'rgba(96,165,250,0.15)' : '#60a5fa',
              border: '1.5px solid #60a5fa',
              color: isPlaying ? '#60a5fa' : '#fff',
              fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* 開始時刻 */}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {fmtHHMM(frames[0].time)}
          </span>

          {/* スライダー */}
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={frameIndex}
            onChange={e => { setIsPlaying(false); setFrameIndex(Number(e.target.value)) }}
            style={{ flex: 1, accentColor: '#60a5fa', cursor: 'pointer', minWidth: 0 }}
          />

          {/* 終了時刻 */}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {fmtHHMM(frames[frames.length - 1].time)}
          </span>

          {/* 現在フレーム時刻 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            background: 'rgba(96,165,250,0.12)', borderRadius: 6,
            padding: '3px 9px', border: '1px solid rgba(96,165,250,0.25)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 5px #60a5fa', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              🌧️ {radarTime
                ? `${radarTime.getMonth()+1}/${radarTime.getDate()} ${String(radarTime.getHours()).padStart(2,'0')}:${String(radarTime.getMinutes()).padStart(2,'0')}`
                : '--:--'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
