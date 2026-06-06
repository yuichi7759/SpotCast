'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/LocaleProvider'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#0f172a', fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
}

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard'); router.refresh() }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      {/* カード */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '36px 32px', boxShadow: '0 8px 32px rgba(15,23,42,0.08)' }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.02em' }}>{t('auth.login')}</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>{t('auth.loginWelcome')}</p>
        </div>


        {/* Google */}
        <button
          onClick={handleGoogle}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px', borderRadius: 10, cursor: 'pointer', border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: 14, fontWeight: 600, marginBottom: 18, boxSizing: 'border-box', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.googleLogin')}
        </button>

        {/* 区切り */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: '#f1f5f9' }}/>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{t('auth.or')}</span>
          <div style={{ flex: 1, height: 1, background: '#f1f5f9' }}/>
        </div>

        {/* フォーム */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email" placeholder={t('auth.email')}
            value={email} onChange={e => setEmail(e.target.value)}
            required style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#93c5fd')}
            onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
          />
          <input
            type="password" placeholder={t('auth.password')}
            value={password} onChange={e => setPassword(e.target.value)}
            required style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#93c5fd')}
            onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
          />
          {error && (
            <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
              {error}
            </div>
          )}
          <button
            type="submit" disabled={loading}
            style={{ padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'default' : 'pointer', background: loading ? '#e2e8f0' : '#1d4ed8', color: loading ? '#94a3b8' : '#fff', fontSize: 14, fontWeight: 700, boxShadow: loading ? 'none' : '0 4px 14px rgba(29,78,216,0.3)', transition: 'all 0.15s' }}
          >
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 12 }}>
          <Link href="/auth/forgot-password" style={{ color: '#64748b', textDecoration: 'none' }}>{t('auth.forgot')}</Link>
        </p>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 8 }}>
          {t('auth.noAccount')}{' '}
          <Link href="/signup" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>{t('auth.signup')}</Link>
        </p>
      </div>
    </div>
  )
}
