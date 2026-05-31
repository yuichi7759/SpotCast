import Link from 'next/link'

export default function SignupPage() {
  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{
        background: '#fff', borderRadius: 20,
        border: '1px solid #e2e8f0', padding: '48px 32px',
        boxShadow: '0 8px 32px rgba(15,23,42,0.08)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>
          現在準備中です
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
          サービスは現在準備中のため、新規登録を一時停止しています。<br/>
          近日公開予定です。
        </p>
        <Link href="/login" style={{ display: 'inline-block', marginTop: 24, fontSize: 13, color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>
          ログインはこちら
        </Link>
      </div>
    </div>
  )
}
