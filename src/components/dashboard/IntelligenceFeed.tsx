'use client'
import { useState, useEffect } from 'react'
import { MOCK_EVENTS, EVENT_CFG, SEVERITY_CFG, timeAgo } from '@/lib/mockIntelligence'
import type { IntelligenceEvent, EventType } from '@/lib/mockIntelligence'
import type { Field } from '@/types/field'
import { calcFieldStatus } from '@/lib/fieldStatus'

interface Props {
  fields: Field[]
  selectedEventId: string | null
  selectedFieldId?: string | null
  activeTypes: EventType[]
  onToggleType: (t: EventType) => void
  onEventClick: (ev: IntelligenceEvent) => void
  onFieldClick: (field: Field) => void
  onFieldEdit: (field: Field) => void
  onAdd: () => void
}

const TYPE_LABELS: { type: EventType; label: string }[] = [
  { type: 'anomaly',  label: '⚠ 警報・注意' },
  { type: 'pest',     label: '🌧️ 大雨' },
  { type: 'weather',  label: '⛅ 気象' },
  { type: 'planting', label: '🌡️ 気温' },
  { type: 'trend',    label: '📈 トレンド' },
  { type: 'harvest',  label: '🌤️ 晴れ情報' },
]

type View = 'intel' | 'fields'

export default function IntelligenceFeed({
  fields, selectedEventId, selectedFieldId, activeTypes, onToggleType, onEventClick, onFieldClick, onFieldEdit, onAdd,
}: Props) {
  const [view, setView] = useState<View>('intel')

  // ポイントが選択されたら自動で「自分のポイント」タブに切り替え
  useEffect(() => {
    if (selectedFieldId) setView('fields')
  }, [selectedFieldId])

  const events = MOCK_EVENTS.filter(e => activeTypes.includes(e.type))
  const alertCount = MOCK_EVENTS.filter(e => e.severity === 'alert').length

  return (
    <div style={{
      width: 296,
      background: 'rgba(6,10,16,0.94)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      flexShrink: 0,
    }}>

      {/* ─── Header ─── */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
          <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%', background: '#ef4444',
              animation: 'liveRing 2s ease-out infinite',
            }}/>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#ef4444' }}/>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>
            FIELD NOW
          </div>
          {alertCount > 0 && (
            <div style={{
              marginLeft: 'auto', background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12,
              padding: '2px 9px', fontSize: 12, fontWeight: 700, color: '#ef4444',
            }}>
              ⚠ {alertCount}件警報
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          天気インテリジェンス · サンプルデータ
        </div>
      </div>

      {/* ─── View toggle ─── */}
      <div style={{
        display: 'flex', gap: 0, padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0,
      }}>
        {(['intel', 'fields'] as View[]).map((v, i) => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: '7px 0', fontSize: 13, fontWeight: view === v ? 700 : 400,
            color: view === v ? '#fff' : 'rgba(255,255,255,0.35)',
            background: view === v ? 'rgba(255,255,255,0.08)' : 'none',
            border: 'none',
            borderRadius: i === 0 ? '8px 0 0 8px' : '0 8px 8px 0',
            outline: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {v === 'intel' ? '🌐 ニュース' : '📍 自分のポイント'}
          </button>
        ))}
      </div>

      {/* ─── Type filter checkboxes (intel view only) ─── */}
      {view === 'intel' && (
        <div style={{
          padding: '10px 12px 8px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 7 }}>
            表示フィルター（複数選択可）
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TYPE_LABELS.map(({ type, label }) => {
              const checked = activeTypes.includes(type)
              const cfg = EVENT_CFG[type]
              return (
                <button
                  key={type}
                  onClick={() => onToggleType(type)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 16,
                    border: `1px solid ${checked ? cfg.color + '60' : 'rgba(255,255,255,0.1)'}`,
                    background: checked ? `${cfg.color}18` : 'rgba(255,255,255,0.03)',
                    color: checked ? cfg.color : 'rgba(255,255,255,0.4)',
                    fontSize: 12, fontWeight: checked ? 600 : 400,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                    border: `1.5px solid ${checked ? cfg.color : 'rgba(255,255,255,0.25)'}`,
                    background: checked ? cfg.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && (
                      <svg viewBox="0 0 10 10" width="8" height="8" fill="none">
                        <path d="M1.5 5l2.5 2.5 5-5" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Content ─── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>

        {/* ── Fields view ── */}
        {view === 'fields' && (
          <>
            {fields.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px', gap: 10 }}>
                <div style={{ fontSize: 32, opacity: 0.2 }}>🗺️</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.6 }}>
                  ポイントが未登録です<br/>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>地図をクリックして追加</span>
                </div>
              </div>
            ) : (
              fields.map(field => {
                const fs = calcFieldStatus(field)
                // fs.color / fs.glowColor はすべて hex (#xxxxxx または #xxxxxxAA)
                const markerColor = field.color ?? fs.color   // 常に hex
                const glowColor   = field.color ? field.color + '99' : fs.glowColor
                const isSelected  = field.id === selectedFieldId
                return (
                  <div
                    key={field.id}
                    onClick={() => onFieldClick(field)}
                    style={{
                      padding: '11px 12px', borderRadius: 12, marginBottom: 4,
                      background: isSelected ? markerColor + '20' : 'rgba(255,255,255,0.025)',
                      border: `1px solid ${isSelected ? markerColor + '99' : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: isSelected ? `0 0 14px ${glowColor}` : 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)' }}
                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)' }}
                  >
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: markerColor, boxShadow: `0 0 8px ${glowColor}`,
                    }}/>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {field.name}
                      </div>
                      <div style={{ fontSize: 12, color: fs.color, marginTop: 2 }}>{fs.stage}</div>
                    </div>
                    {/* Edit button */}
                    <button
                      onClick={e => { e.stopPropagation(); onFieldEdit(field) }}
                      title="編集"
                      style={{
                        flexShrink: 0, width: 28, height: 28, borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background='rgba(167,139,250,0.15)'; el.style.borderColor='rgba(167,139,250,0.3)'; el.style.color='#a78bfa' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background='rgba(255,255,255,0.06)'; el.style.borderColor='rgba(255,255,255,0.1)'; el.style.color='rgba(255,255,255,0.4)' }}
                    >
                      <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z"/>
                      </svg>
                    </button>
                  </div>
                )
              })
            )}
            <button
              onClick={onAdd}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', marginTop: 8, padding: '10px 0', borderRadius: 10,
                border: '1px dashed rgba(29,78,216,0.35)',
                background: 'rgba(29,78,216,0.04)',
                color: '#60a5fa', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              + ポイントを追加
            </button>
          </>
        )}

        {/* ── Intel events ── */}
        {view === 'intel' && (
          <>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
                選択中のカテゴリに情報はありません
              </div>
            ) : events.map(ev => {
              const cfg   = EVENT_CFG[ev.type]
              const scfg  = SEVERITY_CFG[ev.severity]
              const selected = ev.id === selectedEventId
              return (
                <div
                  key={ev.id}
                  onClick={() => onEventClick(ev)}
                  style={{
                    padding: '12px 13px',
                    borderRadius: 14,
                    marginBottom: 6,
                    background: selected
                      ? `linear-gradient(135deg, ${scfg.ring}, rgba(255,255,255,0.03))`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selected ? scfg.badge + '55' : 'rgba(255,255,255,0.07)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    boxShadow: selected ? `0 0 20px ${scfg.badge}22` : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onMouseLeave={e => {
                    if (!selected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                  }}
                >
                  {/* Row 1: icon + severity + title */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 7 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, lineHeight: 1,
                    }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        <div style={{
                          fontSize: 11, fontWeight: 700, color: scfg.badge,
                          background: `${scfg.badge}18`, border: `1px solid ${scfg.badge}33`,
                          borderRadius: 6, padding: '2px 7px', letterSpacing: '0.04em',
                        }}>
                          {SEVERITY_CFG[ev.severity].label}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                          {cfg.label}
                        </div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>
                        {ev.title}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{
                    fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65,
                    display: '-webkit-box',
                    WebkitLineClamp: selected ? 99 : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    marginBottom: 9,
                  }}>
                    {ev.body}
                  </div>

                  {/* Footer: region + time + source */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontSize: 12, color: 'rgba(255,255,255,0.55)',
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: 6, padding: '2px 8px',
                        fontWeight: 500,
                      }}>
                        📍 {ev.region}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                        {timeAgo(ev.timestamp)}
                      </span>
                    </div>

                    {/* Source with optional link */}
                    {ev.sourceUrl ? (
                      <a
                        href={ev.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          fontSize: 11, color: '#60a5fa',
                          textDecoration: 'none',
                          display: 'flex', alignItems: 'center', gap: 3,
                          padding: '2px 6px', borderRadius: 6,
                          border: '1px solid rgba(96,165,250,0.2)',
                          background: 'rgba(96,165,250,0.06)',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(96,165,250,0.14)'}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(96,165,250,0.06)'}
                      >
                        {ev.source}
                        <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M5 1h4v4M2 8l7-7"/>
                        </svg>
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                        {ev.source}
                      </span>
                    )}
                  </div>

                  {/* Mock data disclaimer */}
                  {ev.isMock && (
                    <div style={{
                      marginTop: 7, fontSize: 10, color: 'rgba(255,255,255,0.2)',
                      fontStyle: 'italic',
                    }}>
                      ※ サンプルデータです
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* ─── Footer ─── */}
      <div style={{
        padding: '7px 14px', borderTop: '1px solid rgba(255,255,255,0.04)',
        fontSize: 10, color: 'rgba(255,255,255,0.15)', flexShrink: 0, lineHeight: 1.5,
      }}>
        本番では農水省・気象庁・NAROのAPIを接続予定
      </div>

      <style>{`
        @keyframes liveRing {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(2.8); opacity: 0; }
          100% { transform: scale(2.8); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
