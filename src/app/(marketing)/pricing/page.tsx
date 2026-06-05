'use client'
import { useState } from 'react'
import Link from 'next/link'

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={28} height={37} viewBox="0 0 60 80" fill="none">
        <defs>
          <linearGradient id="priceLg" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d"/>
            <stop offset="42%" stopColor="#b8cad8"/>
            <stop offset="100%" stopColor="#1d4ed8"/>
          </linearGradient>
        </defs>
        <path d="M30 3 C14 3 2 14 2 28 C2 38 7 46 15 54 C20 59 26 65 30 74 C34 65 40 59 45 54 C53 46 58 38 58 28 C58 14 46 3 30 3Z" fill="url(#priceLg)"/>
        <ellipse cx="22" cy="16" rx="8" ry="10" fill="white" opacity="0.2" transform="rotate(-20 22 16)"/>
        <circle cx="30" cy="28" r="11" fill="white" opacity="0.93"/>
      </svg>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: '#0f172a' }}>SpotCast</div>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', fontWeight: 600, color: 'rgba(15,23,42,0.32)', textTransform: 'uppercase', marginTop: 1 }}>Weather Intelligence</div>
      </div>
    </div>
  )
}

const plans = [
  {
    name: 'Free',
    price: '¥0',
    period: '/ 月',
    desc: '個人のお試しに',
    highlight: false,
    features: ['ポイント登録 最大3件','天気予報 7日間','BestDay機能（基本）','雨雲レーダー閲覧'],
    notIncluded: ['天気予報 14日間','AIアシスタント','メールサポート'],
    cta: '無料で始める',
    href: '/signup',
  },
  {
    name: 'Standard',
    price: '¥980',
    period: '/ 月',
    desc: 'ヘビーユーザー・業務利用に',
    highlight: true,
    features: ['ポイント登録 無制限','天気予報 14日間','BestDay機能（全機能）','雨雲レーダー アニメーション','AIアシスタント','会話履歴 無制限','メールサポート'],
    notIncluded: [],
    cta: 'Standardを始める',
    href: '/signup?plan=standard',
  },
]

const faqs = [
  { q: 'クレジットカードなしで始められますか？', a: 'はい。無料プランはクレジットカード不要です。Standardプランへのアップグレード時に決済情報をご入力いただきます。' },
  { q: 'いつでもキャンセルできますか？', a: 'はい。Standardプランはいつでもキャンセルでき、次回更新日まで引き続きご利用いただけます。' },
  { q: 'ポイントとは何ですか？', a: '地図上で登録した任意の場所のことです。農地・工場・観測地点・お気に入りスポットなど、どんな場所でも登録できます。' },
  { q: 'Best Day機能とは何ですか？', a: '登録したポイントごとに、向こう7〜14日間の「晴れに最適な日」や「雨が期待できる日」をスコアで可視化する機能です。複数ポイントを横並びに比較できます。' },
]

export default function PricingPage() {
  const [upgrading, setUpgrading] = useState(false)

  async function handleStandardCta() {
    setUpgrading(true)
    try {
      // Try checkout (works if logged in)
      const res = await fetch('/api/checkout', { method: 'POST' })
      if (res.status === 401) {
        // Not logged in → send to signup
        window.location.href = '/signup?plan=standard'
        return
      }
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      window.location.href = '/signup?plan=standard'
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <main style={{ background: '#f4f6f9', color: '#0f172a', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 48px', background: 'rgba(244,246,249,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(15,23,42,0.07)', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none' }}><Logo/></Link>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>← アプリへ</Link>
          <Link href="/login"    style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>ログイン</Link>
          <Link href="/signup"  style={{ fontSize: 13, fontWeight: 700, textDecoration: 'none', padding: '9px 20px', borderRadius: 10, background: '#1d4ed8', color: '#fff', boxShadow: '0 3px 10px rgba(29,78,216,0.28)' }}>
            無料で始める
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section style={{ textAlign: 'center', padding: '72px 24px 56px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, marginBottom: 20, background: 'rgba(29,78,216,0.07)', border: '1px solid rgba(29,78,216,0.15)', color: '#1d4ed8', fontSize: 12, fontWeight: 700 }}>
          シンプルな2プラン
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, color: '#0f172a', letterSpacing: '-0.02em' }}>まずは無料で試してみてください</h1>
        <p style={{ fontSize: 15, color: '#64748b' }}>クレジットカード不要 · 30秒で登録完了</p>
      </section>

      {/* Plans */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {plans.map(p => (
            <div key={p.name} style={{ position: 'relative', padding: '32px 28px', borderRadius: 20, border: p.highlight ? '2px solid #1d4ed8' : '1px solid #e2e8f0', background: '#fff', boxShadow: p.highlight ? '0 8px 32px rgba(29,78,216,0.1)' : '0 2px 10px rgba(15,23,42,0.05)' }}>
              {p.highlight && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 999, background: '#1d4ed8', color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(29,78,216,0.35)' }}>
                  おすすめ
                </div>
              )}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{p.name}</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{p.period}</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8' }}>{p.desc}</p>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#334155' }}>
                    <svg viewBox="0 0 12 12" width="13" height="13" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M2 6l3 3 5-5" stroke={p.highlight ? '#1d4ed8' : '#15803d'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
                {p.notIncluded.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#cbd5e1' }}>
                    <svg viewBox="0 0 12 12" width="13" height="13" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M3 9l6-6M9 9L3 3" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 24 }}>
                {p.highlight ? (
                  <button
                    onClick={handleStandardCta}
                    disabled={upgrading}
                    style={{ display: 'block', width: '100%', textAlign: 'center', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, border: 'none', cursor: upgrading ? 'default' : 'pointer', boxSizing: 'border-box', background: upgrading ? '#93a9d4' : '#1d4ed8', color: '#fff', boxShadow: upgrading ? 'none' : '0 4px 14px rgba(29,78,216,0.28)', transition: 'all 0.15s' }}
                  >
                    {upgrading ? '処理中...' : p.cta}
                  </button>
                ) : (
                  <Link href={p.href} style={{ display: 'block', width: '100%', textAlign: 'center', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box', background: '#f4f6f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                    {p.cta}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 12, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Standardプランはいつでもキャンセル可能。アップグレードは設定画面から行えます。</p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 96px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', textAlign: 'center', marginBottom: 32, letterSpacing: '-0.02em' }}>よくある質問</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map(faq => (
            <div key={faq.q} style={{ padding: '20px 22px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 7 }}>{faq.q}</p>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.75, margin: 0 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e9ecf0', padding: '24px 48px', background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Link href="/" style={{ textDecoration: 'none' }}><Logo/></Link>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['トップ','/'],['ログイン','/login'],['新規登録','/signup'],['特定商取引法','/tokusho'],['プライバシーポリシー','/privacy'],['利用規約','/terms']].map(([l,h]) => (
            <Link key={h} href={h} style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </main>
  )
}
