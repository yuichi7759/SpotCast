import Link from 'next/link'

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={28} height={28} viewBox="0 0 40 40" fill="none">
        <defs>
          <radialGradient id="authLg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8"/>
            <stop offset="100%" stopColor="#1d4ed8"/>
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill="rgba(29,78,216,0.07)" stroke="rgba(29,78,216,0.18)" strokeWidth="1"/>
        <path d="M9 20 A13 13 0 0 1 20 7"  stroke="#38bdf8" strokeWidth="2"   strokeLinecap="round" opacity="0.55"/>
        <path d="M31 20 A13 13 0 0 0 20 7" stroke="#1d4ed8" strokeWidth="2"   strokeLinecap="round" opacity="0.38"/>
        <path d="M12.5 23.5 A9 9 0 0 1 20 13" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.65"/>
        <path d="M27.5 23.5 A9 9 0 0 0 20 13" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" opacity="0.42"/>
        <path d="M20 13.5 C17 13.5 14.5 16 14.5 19 C14.5 22.8 20 28.5 20 28.5 C20 28.5 25.5 22.8 25.5 19 C25.5 16 23 13.5 20 13.5Z" fill="url(#authLg)"/>
        <circle cx="20" cy="19" r="2.5" fill="white" opacity="0.95"/>
      </svg>
      <div>
        <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: '#0f172a' }}>SpotCast</div>
        <div style={{ fontSize: 8, letterSpacing: '0.12em', fontWeight: 600, color: 'rgba(15,23,42,0.32)', textTransform: 'uppercase', marginTop: 1 }}>Weather Intelligence</div>
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
