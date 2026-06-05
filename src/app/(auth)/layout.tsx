import Link from 'next/link'

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={28} height={37} viewBox="0 0 60 80" fill="none">
        <defs>
          <linearGradient id="authLg" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d"/>
            <stop offset="42%" stopColor="#b8cad8"/>
            <stop offset="100%" stopColor="#1d4ed8"/>
          </linearGradient>
        </defs>
        <path d="M30 3 C14 3 2 14 2 28 C2 38 7 46 15 54 C20 59 26 65 30 74 C34 65 40 59 45 54 C53 46 58 38 58 28 C58 14 46 3 30 3Z" fill="url(#authLg)"/>
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

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f6f9' }}>
      <nav style={{ padding: '14px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(15,23,42,0.07)', background: 'rgba(244,246,249,0.9)', backdropFilter: 'blur(12px)' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo/>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
          ← トップへ戻る
        </Link>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {children}
      </div>
    </div>
  )
}
