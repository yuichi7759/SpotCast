'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SupportPage() {
  const [email,   setEmail]   = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')
  const router = useRouter()

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      setError('件名とメッセージを入力してください')
      return
    }
    setSending(true); setError('')
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '送信に失敗しました')
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '送信に失敗しました')
    } finally {
      setSending(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#f0f0f0', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#080c14', color: '#f0f0f0' }}>

      {/* Header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(8,12,20,0.95)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button
          onClick={() => router.push('/settings')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9,2 4,7 9,12"/>
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>サポートへ問い合わせ</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>

          {done ? (
            /* 送信完了 */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 16, padding: '48px 24px', textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(52,211,153,0.15)',
                border: '1px solid rgba(52,211,153,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26,
              }}>✓</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                  送信しました
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
                  お問い合わせを受け付けました。<br/>
                  内容を確認の上、ご登録のメールアドレスへご返信します。
                </div>
              </div>
              <button
                onClick={() => router.push('/settings')}
                style={{
                  marginTop: 8, padding: '10px 28px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                設定に戻る
              </button>
            </div>
          ) : (
            /* フォーム */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6,
              }}>
                ご不明な点・ご要望・不具合の報告など、お気軽にお問い合わせください。
              </div>

              {/* メール（表示のみ） */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  メールアドレス
                </label>
                <div style={{ ...inputStyle, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.03)' }}>
                  {email || '取得中...'}
                </div>
              </div>

              {/* 件名 */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  件名 <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  style={inputStyle}
                  placeholder="例：ポイントが保存されない"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              {/* メッセージ */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                  メッセージ <span style={{ color: '#f87171' }}>*</span>
                </label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 140, fontFamily: 'inherit', lineHeight: 1.7 } as React.CSSProperties}
                  placeholder="詳しい状況や再現手順を教えていただくと、迅速に対応できます。"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              {error && (
                <div style={{
                  fontSize: 13, color: '#f87171',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8, padding: '8px 12px',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                style={{
                  padding: '12px 0', borderRadius: 10, border: 'none',
                  background: sending ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #38bdf8, #1d4ed8)',
                  color: sending ? 'rgba(255,255,255,0.3)' : '#fff',
                  fontSize: 14, fontWeight: 700,
                  cursor: sending ? 'default' : 'pointer',
                  boxShadow: sending ? 'none' : '0 4px 16px rgba(29,78,216,0.3)',
                  transition: 'all 0.15s',
                }}
              >
                {sending ? '送信中...' : '送信する'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
