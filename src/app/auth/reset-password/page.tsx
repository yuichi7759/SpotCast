'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/components/LocaleProvider'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #e2e8f0', background: '#fff',
  color: '#0f172a', fontSize: 14,
  boxSizing: 'border-box', outline: 'none',
  transition: 'border-color 0.15s',
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const { t } = useLocale()
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== password2) { setError(t('auth.pwMismatch')); return }
    if (password.length < 8)    { setError(t('auth.pwTooShort')); return }
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/dashboard') }
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '36px 32px', boxShadow: '0 8px 32px rgba(15,23,42,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>{t('auth.newPwTitle')}</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>{t('auth.newPwHint')}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="password" placeholder={t('auth.newPw')}
            value={password} onChange={e => setPassword(e.target.value)}
            minLength={8} required style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#93c5fd')}
            onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
          />
          <input
            type="password" placeholder={t('auth.newPw2')}
            value={password2} onChange={e => setPassword2(e.target.value)}
            minLength={8} required style={inputStyle}
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
            {loading ? t('auth.updating') : t('auth.updatePw')}
          </button>
        </form>
      </div>
    </div>
  )
}
