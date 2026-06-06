'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/components/LocaleProvider'
import Link from 'next/link'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #e2e8f0', background: '#fff',
  color: '#0f172a', fontSize: 14,
  boxSizing: 'border-box', outline: 'none',
  transition: 'border-color 0.15s',
}

export default function ForgotPasswordPage() {
  const { t } = useLocale()
  const [email,   setEmail]   = useState('')
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setDone(true) }
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '36px 32px', boxShadow: '0 8px 32px rgba(15,23,42,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>{t('auth.resetTitle')}</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>{t('auth.resetHint')}</p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
            <p style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, marginBottom: 8 }}>{t('auth.resetSentTitle')}</p>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
              {t('auth.resetSentBody', { email })}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email" placeholder={t('auth.email')}
              value={email} onChange={e => setEmail(e.target.value)}
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
              {loading ? t('auth.sending') : t('auth.resetSend')}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
          <Link href="/login" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </div>
  )
}
