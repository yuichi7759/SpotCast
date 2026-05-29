'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: number; message: string; sub?: string; type: ToastType }

interface ToastContextValue {
  success: (message: string, sub?: string) => void
  error: (message: string, sub?: string) => void
  info: (message: string, sub?: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {}, error: () => {}, info: () => {},
})

export function useToast() { return useContext(ToastContext) }

const COLORS: Record<ToastType, string> = {
  success: '#3ecf8e', error: '#ef4444', info: '#60a5fa',
}
const ICONS: Record<ToastType, string> = {
  success: '✓', error: '✕', info: 'i',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((type: ToastType, message: string, sub?: string) => {
    const id = Date.now() + Math.random()
    setToasts(p => [...p, { id, message, sub, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200)
  }, [])

  const ctx: ToastContextValue = {
    success: (m, s) => add('success', m, s),
    error:   (m, s) => add('error', m, s),
    info:    (m, s) => add('info', m, s),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <style>{`
        @keyframes toastIn  { from { transform:translateX(110%); opacity:0 } to { transform:translateX(0); opacity:1 } }
        @keyframes toastOut { from { opacity:1 } to { opacity:0; transform:translateX(110%) } }
      `}</style>
      <div style={{
        position: 'fixed', top: 16, right: 16, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(8,12,18,0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: `3px solid ${COLORS[t.type]}`,
            borderRadius: 12,
            padding: '11px 16px 11px 12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'toastIn 0.28s cubic-bezier(0.22,1,0.36,1)',
            minWidth: 240, maxWidth: 340,
            pointerEvents: 'auto',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: `${COLORS[t.type]}20`,
              border: `1px solid ${COLORS[t.type]}40`,
              color: COLORS[t.type],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800,
            }}>
              {ICONS[t.type]}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{t.message}</div>
              {t.sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{t.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
