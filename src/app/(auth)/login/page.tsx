'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.02em' }}>ログイン</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>SpotCastへようこそ</p>
        </div>


        {/* フォーム */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email" placeholder="メールアドレス"
            value={email} onChange={e => setEmail(e.target.value)}
            required style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#93c5fd')}
            onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
          />
          <input
            type="password" placeholder="パスワード"
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
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
          アカウントをお持ちでない方は{' '}
          <Link href="/signup" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>新規登録</Link>
        </p>
      </div>
    </div>
  )
}
