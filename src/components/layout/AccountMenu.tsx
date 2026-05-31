'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UserInfo {
  email: string
  plan: 'free' | 'pro'
  initial: string
}

export default function AccountMenu() {
  const [info, setInfo]       = useState<UserInfo | null>(null)
  const [open, setOpen]       = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')
  const menuRef               = useRef<HTMLDivElement>(null)
  const router                = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user
      if (!user) return
      const { data: row } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single()
      setInfo({
        email: user.email ?? '',
        plan: (row?.plan ?? 'free') as 'free' | 'pro',
        initial: (user.email ?? '?')[0].toUpperCase(),
      })
    })
  }, [])

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleUpgrade() {
    setUpgrading(true)
    setUpgradeError('')
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      setUpgradeError(data.error ?? 'エラーが発生しました')
    } catch {
      setUpgradeError('通信エラーが発生しました')
    } finally {
      setUpgrading(false)
    }
  }

  if (!info) return null

  const isPro = info.plan === 'pro'

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(v => !v)}
        title={info.email}
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: isPro
            ? 'linear-gradient(135deg, #fbbf24, #f97316)'
            : 'linear-gradient(135deg, #38bdf8, #1d4ed8)',
          border: `2px solid ${open ? (isPro ? '#fbbf24' : '#60a5fa') : 'rgba(255,255,255,0.15)'}`,
          color: '#fff', fontSize: 12, fontWeight: 800,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? `0 0 10px ${isPro ? '#fbbf2466' : '#60a5fa44'}` : 'none',
          transition: 'all 0.15s', flexShrink: 0,
        }}
      >
        {info.initial}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 38, right: 0,
          width: 220,
          background: 'rgba(8,12,20,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          zIndex: 999,
          animation: 'acctFadeIn 0.15s ease both',
        }}>
          <style>{`@keyframes acctFadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* User info */}
          <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{
              fontSize: 12, color: '#fff', fontWeight: 700,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{info.email}</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                padding: '2px 8px', borderRadius: 20,
                background: isPro ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${isPro ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.15)'}`,
                color: isPro ? '#fbbf24' : 'rgba(255,255,255,0.5)',
              }}>
                {isPro ? '⚡ STANDARD' : 'FREE'}
              </span>
            </div>
          </div>

          {/* Upgrade (free only) */}
          {!isPro && (
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                style={{
                  width: '100%', padding: '8px 0', borderRadius: 8,
                  background: upgrading ? 'rgba(251,191,36,0.1)' : 'linear-gradient(135deg, #fbbf24, #f97316)',
                  border: 'none',
                  color: upgrading ? 'rgba(255,255,255,0.4)' : '#000',
                  fontSize: 12, fontWeight: 800, cursor: upgrading ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {upgrading ? '処理中...' : '⚡ Standardにアップグレード'}
              </button>
              {upgradeError && (
                <div style={{ marginTop: 6, fontSize: 11, color: '#f87171', lineHeight: 1.4 }}>
                  ⚠️ {upgradeError}
                </div>
              )}
            </div>
          )}

          {/* Menu items */}
          <div style={{ padding: '6px' }}>
            <button
              onClick={() => { setOpen(false); router.push('/settings') }}
              style={menuItemStyle}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="8" cy="8" r="2.2"/>
                <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4"/>
              </svg>
              設定
            </button>
            <button
              onClick={handleLogout}
              style={{ ...menuItemStyle, color: '#f87171' }}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3"/>
                <polyline points="11,11 14,8 11,5"/>
                <line x1="14" y1="8" x2="6" y2="8"/>
              </svg>
              ログアウト
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  width: '100%', padding: '8px 10px', borderRadius: 8,
  background: 'transparent', border: 'none',
  color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
  cursor: 'pointer', textAlign: 'left',
  transition: 'background 0.12s',
}
