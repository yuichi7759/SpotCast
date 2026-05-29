'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#0f172a', fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s',
}

export default function SignupPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setDone(true) }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  if (done) {
    return (
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '48px 32px', boxShadow: '0 8px 32px rgba(15,23,42,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>確認メールを送信しました</h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
            <strong style={{ color: '#1d4ed8' }}>{email}</strong> に届いたリンクをクリックして登録を完了してください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '36px 32px', boxShadow: '0 8px 32px rgba(15,23,42,0.08)' }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.02em' }}>新規登録</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>無料で始められます · クレジットカード不要</p>
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
          Google で登録
        </button>

        {/* 区切り */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: '#f1f5f9' }}/>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>または</span>
          <div style={{ flex: 1, height: 1, background: '#f1f5f9' }}/>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email" placeholder="メールアドレス"
            value={email} onChange={e => setEmail(e.target.value)}
            required style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#93c5fd')}
            onBlur={e  => (e.currentTarget.style.borderColor = '#e2e8f0')}
          />
          <input
            type="password" placeholder="パスワード（8文字以上）"
            value={password} onChange={e => setPassword(e.target.value)}
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
            {loading ? '登録中...' : '無料で登録'}
          </button>
        </form>

        {/* 無料プランの内訳 */}
        <div style={{ marginTop: 18, padding: '13px 15px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>無料プランに含まれるもの</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {['ポイント登録 最大5件','天気予報 7日間','BestDay機能','雨雲レーダー閲覧'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#1e40af' }}>
                <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
                  <path d="M1.5 5l2.5 2.5 4.5-4" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {f}
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 }}>
          すでにアカウントをお持ちの方は{' '}
          <Link href="/login" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>ログイン</Link>
        </p>
      </div>
    </div>
  )
}
