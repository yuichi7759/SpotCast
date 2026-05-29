'use client'
import type { Field } from '@/types/field'

interface Props {
  fields: Field[]
  selectedId: string | null
  onSelect: (field: Field) => void
  onAdd: () => void
}

export default function FieldListPanel({ fields, selectedId, onSelect, onAdd }: Props) {

  return (
    <div style={{
      background: 'rgba(8,12,18,0.78)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      width: 214,
      maxHeight: 'calc(100vh - 160px)',
      display: 'flex',
      flexDirection: 'column',
      color: '#f0f0f0',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '13px 14px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: 'linear-gradient(135deg, rgba(29,78,216,0.25), rgba(29,78,216,0.1))',
          border: '1px solid rgba(29,78,216,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
        }}>📍</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1 }}>ポイント一覧</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{fields.length}件登録済み</div>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {fields.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 12px', gap: 8 }}>
            <div style={{ fontSize: 24, opacity: 0.3 }}>🗺️</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.5 }}>
              まだポイントがありません<br/>
              <span style={{ opacity: 0.6 }}>地図をクリックして追加</span>
            </div>
          </div>
        ) : (
          fields.map(field => {
            const active = selectedId === field.id
            return (
              <div
                key={field.id}
                onClick={() => onSelect(field)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 10, marginBottom: 2,
                  border: active ? '1px solid rgba(29,78,216,0.3)' : '1px solid transparent',
                  background: active ? 'rgba(29,78,216,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', transition: 'all 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{
                  width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                  background: field.color ?? '#60a5fa',
                  boxShadow: active ? `0 0 8px ${field.color ?? '#60a5fa'}` : 'none',
                }}/>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 12, fontWeight: active ? 700 : 600,
                    color: active ? '#fff' : 'rgba(255,255,255,0.8)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{field.name}</div>
                  <div style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.35)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1,
                  }}>{field.crop ?? '登録済みポイント'}{field.variety ? ` · ${field.variety}` : ''}</div>
                </div>

              </div>
            )
          })
        )}
      </div>

      {/* Add button */}
      <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button
          onClick={onAdd}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '9px 0', borderRadius: 10,
            border: '1px dashed rgba(29,78,216,0.35)',
            background: 'rgba(29,78,216,0.05)',
            color: '#60a5fa', fontWeight: 700, fontSize: 12,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = 'rgba(29,78,216,0.12)'
            el.style.borderColor = 'rgba(29,78,216,0.6)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = 'rgba(29,78,216,0.05)'
            el.style.borderColor = 'rgba(29,78,216,0.35)'
          }}
        >
          <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
          </svg>
          ポイントを追加
        </button>
      </div>
    </div>
  )
}
