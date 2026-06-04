import Link from 'next/link'

function Logo({ dark = false, size = 30 }: { dark?: boolean; size?: number }) {
  const h = Math.round(size * 1.33)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={h} viewBox="0 0 60 80" fill="none">
        <defs>
          <linearGradient id="lgMain" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d"/>
            <stop offset="42%" stopColor="#b8cad8"/>
            <stop offset="100%" stopColor="#1d4ed8"/>
          </linearGradient>
        </defs>
        <path d="M30 3 C14 3 2 14 2 28 C2 38 7 46 15 54 C20 59 26 65 30 74 C34 65 40 59 45 54 C53 46 58 38 58 28 C58 14 46 3 30 3Z" fill="url(#lgMain)"/>
        <ellipse cx="22" cy="16" rx="8" ry="10" fill="white" opacity="0.2" transform="rotate(-20 22 16)"/>
        <circle cx="30" cy="28" r="11" fill="white" opacity="0.93"/>
      </svg>
      <div>
        <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, color: dark ? '#fff' : '#0f172a' }}>SpotCast</div>
        <div style={{ fontSize: 8, letterSpacing: '0.12em', fontWeight: 600, color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.32)', textTransform: 'uppercase', marginTop: 1 }}>
          Weather Intelligence
        </div>
      </div>
    </div>
  )
}

/** 実際のダッシュボードを再現したモックアップ */
function AppMockup() {
  return (
    <div style={{
      borderRadius: 20, overflow: 'hidden',
      boxShadow: '0 40px 80px rgba(15,23,42,0.18), 0 8px 24px rgba(15,23,42,0.1)',
      border: '1px solid rgba(15,23,42,0.12)',
    }}>
      {/* ── window chrome ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#1a2030', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }}/>)}
        <div style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>spotcast.app/dashboard</div>
      </div>

      {/* ── ダーク地図エリア ── */}
      <div style={{ position: 'relative', height: 260, background: '#0d1520', overflow: 'hidden' }}>
        {/* 地図タイル SVG */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 500 260" preserveAspectRatio="xMidYMid slice">
          <rect width="500" height="260" fill="#0d1e30"/>
          {/* 陸地 */}
          <path d="M0,62 L75,50 L145,63 L205,51 L265,66 L315,54 L378,67 L500,54 L500,260 L0,260 Z" fill="#132030" opacity="0.95"/>
          <path d="M0,105 L65,93 L140,106 L210,94 L278,107 L350,95 L440,108 L500,97 L500,260 L0,260 Z" fill="#0f1a28" opacity="0.8"/>
          {/* 道路 */}
          <line x1="0" y1="148" x2="500" y2="146" stroke="#1e3346" strokeWidth="2"/>
          <line x1="0" y1="185" x2="500" y2="183" stroke="#1e3346" strokeWidth="1.5"/>
          <line x1="130" y1="48" x2="128" y2="260" stroke="#1e3346" strokeWidth="1.5"/>
          <line x1="320" y1="48" x2="318" y2="260" stroke="#1e3346" strokeWidth="1.2"/>
          <line x1="460" y1="48" x2="458" y2="260" stroke="#1e3346" strokeWidth="1"/>
          {/* 市街地グリッド */}
          {[0,1,2,3,4].map(i => (
            <line key={`h${i}`} x1="60" y1={112+i*18} x2="122" y2={112+i*18} stroke="#1a2e44" strokeWidth="0.8" opacity="0.7"/>
          ))}
          {[0,1,2,3].map(i => (
            <line key={`v${i}`} x1={70+i*15} y1="110" x2={70+i*15} y2="220" stroke="#1a2e44" strokeWidth="0.8" opacity="0.7"/>
          ))}
          {/* 建物ブロック */}
          {[[72,116,10,8],[86,116,13,8],[72,130,10,10],[88,132,12,8],[72,146,22,8],[336,122,10,8],[350,120,13,10],[366,124,10,8],[336,136,24,8]].map(([x,y,w,h],i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="1" fill="#1c3048" opacity="0.8"/>
          ))}
        </svg>

        {/* 雨雲レーダーオーバーレイ（screen blend） */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'screen' }} viewBox="0 0 500 260">
          <defs>
            <radialGradient id="rm1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.52"/>
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="rm2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.48"/>
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="rm3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.58"/>
              <stop offset="55%" stopColor="#f97316" stopOpacity="0.28"/>
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <ellipse cx="350" cy="155" rx="145" ry="92" fill="url(#rm1)"/>
          <ellipse cx="318" cy="132" rx="92" ry="65" fill="url(#rm2)"/>
          <ellipse cx="335" cy="123" rx="45" ry="36" fill="url(#rm3)"/>
        </svg>

        {/* ピン1: 晴れ */}
        <div style={{ position: 'absolute', left: '18%', top: '28%' }}>
          <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#fbbf24', border: '2.5px solid #fff', boxShadow: '0 0 8px rgba(251,191,36,0.8)' }}/>
          <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,12,22,0.92)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', whiteSpace: 'nowrap', fontSize: 10, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            ☀️ 24° <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>降水 3%</span>
          </div>
        </div>
        {/* ピン2: 雨まじり */}
        <div style={{ position: 'absolute', left: '52%', top: '47%' }}>
          <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#38bdf8', border: '2.5px solid #fff', boxShadow: '0 0 8px rgba(56,189,248,0.7)' }}/>
          <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,12,22,0.92)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', whiteSpace: 'nowrap', fontSize: 10, fontWeight: 800, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            🌦️ 18° <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>降水 55%</span>
          </div>
        </div>
        {/* ピン3 */}
        <div style={{ position: 'absolute', right: '13%', top: '27%' }}>
          <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#a78bfa', border: '2.5px solid #fff', boxShadow: '0 0 8px rgba(167,139,250,0.7)' }}/>
        </div>

        {/* 右上バッジ */}
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(8,14,24,0.88)', backdropFilter: 'blur(10px)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 8, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: '#38bdf8' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }}/>
          雨雲レーダー LIVE
        </div>

        {/* 凡例 */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(8,14,24,0.80)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '5px 9px', display: 'flex', gap: 5, alignItems: 'center' }}>
          {[['#22d3ee','弱'],['#4ade80','中'],['#facc15','強'],['#f97316','豪']].map(([c,l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ width: 16, height: 5, borderRadius: 2, background: c, opacity: 0.85 }}/>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* ズームコントロール */}
        <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {['+','−'].map(s => (
            <div key={s} style={{ width: 24, height: 24, background: 'rgba(8,14,24,0.88)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 700 }}>{s}</div>
          ))}
        </div>
      </div>

      {/* ── 天気カード（実際のアプリと同じダーク） ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: '#111827', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { n: '工場屋上', i: '☀️', t: '24°', rain: '3%',  c: '#fbbf24' },
          { n: '北側農地', i: '🌦️', t: '18°', rain: '55%', c: '#38bdf8' },
          { n: '観測点A',  i: '🌧️', t: '15°', rain: '88%', c: '#a78bfa' },
        ].map((p, idx) => (
          <div key={p.n} style={{ padding: '11px 13px', borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: idx === 1 ? 'rgba(56,189,248,0.05)' : 'transparent' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', marginBottom: 4, fontWeight: 600 }}>{p.n}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 14 }}>{p.i}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: p.c }}>{p.t}</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>💧{p.rain}</div>
          </div>
        ))}
      </div>

      {/* ── レーダータイムライン ── */}
      <div style={{ padding: '9px 14px', background: '#0f1520', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(14,165,233,0.4)' }}>
          <svg viewBox="0 0 10 12" width="8" height="9" fill="white"><path d="M1 1L9 6L1 11Z"/></svg>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 2 }}>
          {['-2h','-1.5h','-1h','-30m','今'].map((t, i) => (
            <div key={t} style={{ flex: 1, height: 18, borderRadius: 4, background: i === 4 ? 'linear-gradient(135deg,#0ea5e9,#2563eb)' : `rgba(14,165,233,${0.1+i*0.05})`, border: i === 4 ? 'none' : '1px solid rgba(14,165,233,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: i === 4 ? '#fff' : 'rgba(56,189,248,0.55)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    // 白すぎず、純白でもない — f5f7fa (slate-50 より少しグレー)
    <main style={{ background: '#f4f6f9', color: '#0f172a', overflowX: 'hidden' }}>

      {/* ━━━━━ Nav ━━━━━ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 48px',
        background: 'rgba(244,246,249,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(15,23,42,0.08)',
      }}>
        <Logo dark={false}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link href="/pricing" style={{ fontSize: 14, color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>料金</Link>
          <Link href="/login"   style={{ fontSize: 14, color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>ログイン</Link>
          <Link href="/signup" style={{ fontSize: 14, fontWeight: 700, textDecoration: 'none', padding: '10px 22px', borderRadius: 12, background: '#1d4ed8', color: '#fff', boxShadow: '0 4px 14px rgba(29,78,216,0.32)' }}>
            無料で始める →
          </Link>
        </div>
      </nav>

      {/* ━━━━━ Hero ━━━━━ */}
      {/* 少しだけ青みがかった背景でヒーローに深さを */}
      <section style={{ background: 'linear-gradient(160deg,#e8eef8 0%,#edf1f7 40%,#f4f6f9 100%)', padding: '96px 48px 88px', position: 'relative', overflow: 'hidden' }}>
        {/* ごく薄いブルーグロー */}
        <div style={{ position: 'absolute', top: '-15%', left: '-6%', width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(rgba(37,99,235,0.1),transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', top: '20%', right: '-6%', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(rgba(14,165,233,0.08),transparent 70%)', pointerEvents: 'none' }}/>

        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 72, flexWrap: 'wrap' }}>
          {/* Left */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, marginBottom: 28, background: 'rgba(29,78,216,0.07)', border: '1px solid rgba(29,78,216,0.15)', color: '#1d4ed8', fontSize: 12, fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1d4ed8', display: 'inline-block' }}/>
              地図から登録する、あなた専用の天気予報
            </div>

            {/* ── 変更後のキャッチコピー ── */}
            <h1 style={{ fontSize: 60, fontWeight: 900, lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: 24, color: '#0f172a' }}>
              世界中の<br/>
              気になる場所の天気<br/>
              <span style={{ color: '#1d4ed8' }}>ワンクリックで。</span>
            </h1>

            <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.78, marginBottom: 38, maxWidth: 440 }}>
              地図をクリックするだけ。農地・工場・観測点・旅先どこでも—<br/>
              <strong style={{ color: '#1e3a8a' }}>リアルタイム天気と14日予報</strong>をすぐ確認。
            </p>

            <div style={{ display: 'flex', gap: 14, marginBottom: 48, flexWrap: 'wrap' }}>
              <Link href="/signup" style={{ padding: '14px 32px', borderRadius: 14, textDecoration: 'none', background: '#1d4ed8', color: '#fff', fontSize: 15, fontWeight: 900, boxShadow: '0 6px 20px rgba(29,78,216,0.35)' }}>
                無料で始める →
              </Link>
              <Link href="/pricing" style={{ padding: '14px 32px', borderRadius: 14, textDecoration: 'none', border: '1.5px solid #cbd5e1', color: '#475569', fontSize: 15, fontWeight: 700, background: 'rgba(255,255,255,0.7)' }}>
                料金を見る
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { v: '無料', s: '5ポイントまで', bg: '#dbeafe', c: '#1e40af' },
                { v: '14日間', s: '週間予報', bg: '#dcfce7', c: '#15803d' },
                { v: 'LIVE', s: '雨雲レーダー', bg: '#ede9fe', c: '#6d28d9' },
              ].map(p => (
                <div key={p.v} style={{ padding: '10px 18px', borderRadius: 14, background: p.bg }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: p.c, lineHeight: 1 }}>{p.v}</div>
                  <div style={{ fontSize: 11, color: p.c, opacity: 0.6, marginTop: 3 }}>{p.s}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — 実際のアプリのデモ動画 */}
          <div style={{ flex: 1, minWidth: 300, maxWidth: 560 }}>
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid #d3dbe6',
              boxShadow: '0 24px 60px rgba(15,23,42,0.22), 0 4px 14px rgba(15,23,42,0.08)',
              background: '#0a0e16', lineHeight: 0,
            }}>
              <video
                src="/hero.mp4"
                poster="/hero-poster.jpg"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━ Features ━━━━━ */}
      {/* 白カードをグレー背景に置くと浮き上がって見える */}
      <section style={{ padding: '88px 48px', background: '#f4f6f9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>できること</p>
            <p style={{ fontSize: 16, color: '#64748b' }}>場所を登録するだけで、天気のすべてがわかる</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16 }}>
            {[
              { icon: '📍', title: 'ポイント登録', c: '#1d4ed8', bg: '#fff', border: '#e2e8f0', desc: '地図をクリックするだけ。農地・工場・観測点・旅先など、どんな場所でも登録できます。' },
              { icon: '🌤', title: '天気予報',    c: '#15803d', bg: '#fff', border: '#e2e8f0', desc: '各ポイントの最大14日間予報。気温・降水確率・風速を時間単位で確認できます。' },
              { icon: '⭐', title: 'Best Day',   c: '#b45309', bg: '#fff', border: '#e2e8f0', desc: '「晴れに最適な日」「雨が期待できる日」を0〜100スコアで一覧比較。全ポイント×14日間。', badge: '目玉' },
              { icon: '🌧️', title: '雨雲レーダー', c: '#6d28d9', bg: '#fff', border: '#e2e8f0', desc: 'リアルタイム雨雲をマップに重ねて表示。過去2時間のアニメーション再生にも対応。' },
            ].map(f => (
              <div key={f.title} style={{ position: 'relative', padding: '26px 22px', borderRadius: 16, background: f.bg, border: `1px solid ${f.border}`, boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
                {f.badge && (
                  <span style={{ position: 'absolute', top: 14, right: 14, padding: '2px 8px', borderRadius: 999, background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontSize: 10, fontWeight: 700 }}>{f.badge}</span>
                )}
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: f.c, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ Best Day ━━━━━ */}
      <section style={{ padding: '88px 48px', background: '#fff', borderTop: '1px solid #e9ecf0', borderBottom: '1px solid #e9ecf0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 72, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
              ⭐ Best Day 機能
            </div>
            <h2 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 16, color: '#0f172a' }}>
              「いつ行く？」に<br/><span style={{ color: '#1d4ed8' }}>即答します。</span>
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.78, marginBottom: 22, maxWidth: 400 }}>
              登録したすべてのポイントについて、向こう14日間の「ベスト日」をひと目で確認。
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                ['☀️', '晴れモード：屋外作業・撮影・イベントに最適な日を提案'],
                ['🌧️', '雨モード：水やり不要・恵みの雨が期待できる日を表示'],
                ['📊', '0〜100スコアで良し悪しを直感的に把握'],
                ['📍', '複数ポイントを横並び比較。場所ごとの差も一目瞭然'],
              ].map(([icon, text]) => (
                <li key={text as string} style={{ display: 'flex', gap: 10, fontSize: 14, color: '#475569' }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>{text}
                </li>
              ))}
            </ul>
          </div>

          {/* BestDay mockup */}
          <div style={{ flex: 1, minWidth: 280, maxWidth: 440 }}>
            <div style={{ borderRadius: 18, background: '#fff', border: '1px solid #e2e8f0', padding: 22, boxShadow: '0 8px 32px rgba(15,23,42,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>Best Day</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontSize: 11, fontWeight: 700 }}>☀️ 晴れ</span>
                  <span style={{ padding: '4px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 11 }}>🌧️ 雨</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '76px repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
                <div/>
                {['今日','明','水','木','金','土','日'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 9, color: '#94a3b8', fontWeight: 700 }}>{d}</div>
                ))}
              </div>
              {[
                { name: '工場屋上', scores: [92,74,46,95,62,85,33] },
                { name: '北側農地', scores: [85,70,43,88,57,80,29] },
                { name: '観測点A',  scores: [78,91,58,73,87,63,44] },
              ].map(row => (
                <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '76px repeat(7,1fr)', gap: 2, marginBottom: 2 }}>
                  <div style={{ fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', paddingRight: 4, overflow: 'hidden' }}>{row.name}</div>
                  {row.scores.map((score, i) => {
                    const [bg, fg] = score >= 85 ? ['#dcfce7','#15803d'] : score >= 68 ? ['#dbeafe','#1d4ed8'] : score >= 45 ? ['#fef9c3','#a16207'] : ['#fee2e2','#b91c1c']
                    return (
                      <div key={i} style={{ borderRadius: 5, textAlign: 'center', padding: '5px 0', background: bg }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: fg }}>{score}</span>
                      </div>
                    )
                  })}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                {[['#dcfce7','#15803d','85+'],['#dbeafe','#1d4ed8','68+'],['#fef9c3','#a16207','45+'],['#fee2e2','#b91c1c','〜44']].map(([bg,fg,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: `1px solid ${fg}22` }}/>
                    <span style={{ fontSize: 9, fontWeight: 700, color: fg }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━ Steps ━━━━━ */}
      <section style={{ padding: '80px 48px', background: '#f4f6f9' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <p style={{ fontSize: 30, fontWeight: 900, color: '#0f172a' }}>使い方は3ステップ</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
            {[
              { step: '01', icon: '🔐', title: 'アカウント作成',    desc: 'メールまたはGoogleで無料登録。クレジットカード不要。30秒で完了。',    bg: '#eff6ff', border: '#bfdbfe' },
              { step: '02', icon: '📍', title: '地図でポイント登録', desc: 'マップを開いて場所をクリック。名前をつけて保存するだけ。',              bg: '#f0fdf4', border: '#bbf7d0' },
              { step: '03', icon: '☀️', title: '天気・BestDayを確認', desc: '各ポイントの予報とBestDayスコアがすぐに表示されます。',              bg: '#fffbeb', border: '#fde68a' },
            ].map((s, i) => (
              <div key={s.step} style={{ display: 'flex', gap: 16, padding: '22px 20px', borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
                <div style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 12, background: s.bg, border: `1.5px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 9, color: '#1d4ed8', fontWeight: 900, letterSpacing: '0.15em', marginBottom: 4 }}>STEP {s.step}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ Pricing ━━━━━ */}
      <section style={{ padding: '80px 48px', background: '#fff', borderTop: '1px solid #e9ecf0' }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <p style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>シンプルな料金</p>
            <p style={{ fontSize: 15, color: '#64748b' }}>まずは無料で試してみてください</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {[
              { name: 'Free', price: '¥0', period: '/ 月', desc: '個人のお試しに', highlight: false, features: ['ポイント登録 最大5件','天気予報 7日間','BestDay機能（基本）','雨雲レーダー閲覧'], cta: '無料で始める', href: '/signup' },
              { name: 'Standard', price: '¥980', period: '/ 月', desc: 'ヘビーユーザー・業務利用に', highlight: true, features: ['ポイント登録 無制限','天気予報 14日間','BestDay機能（全機能）','雨雲レーダー アニメーション','AIアシスタント','メールサポート'], cta: 'Standardを始める', href: '/signup?plan=standard' },
            ].map(p => (
              <div key={p.name} style={{ position: 'relative', padding: '30px 26px', borderRadius: 20, border: p.highlight ? '2px solid #1d4ed8' : '1px solid #e2e8f0', background: '#fff', boxShadow: p.highlight ? '0 8px 32px rgba(29,78,216,0.1)' : '0 2px 8px rgba(15,23,42,0.04)' }}>
                {p.highlight && (
                  <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 999, background: '#1d4ed8', color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(29,78,216,0.35)' }}>おすすめ</div>
                )}
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{p.name}</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{p.period}</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 22 }}>{p.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#334155' }}>
                      <svg viewBox="0 0 12 12" width="13" height="13" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M2 6l3 3 5-5" stroke={p.highlight ? '#1d4ed8' : '#15803d'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.href} style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', background: p.highlight ? '#1d4ed8' : '#f4f6f9', color: p.highlight ? '#fff' : '#475569', border: p.highlight ? 'none' : '1px solid #e2e8f0', boxShadow: p.highlight ? '0 4px 14px rgba(29,78,216,0.28)' : 'none' }}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━ CTA ━━━━━ */}
      <section style={{ padding: '88px 48px', background: 'linear-gradient(160deg,#eff6ff 0%,#dbeafe 100%)', textAlign: 'center', borderTop: '1px solid #e9ecf0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 999, marginBottom: 22, background: 'rgba(29,78,216,0.09)', border: '1px solid rgba(29,78,216,0.18)', color: '#1d4ed8', fontSize: 13, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1d4ed8', display: 'inline-block' }}/>
          今すぐ無料で始められます
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', marginBottom: 14, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          場所を登録して、<br/><span style={{ color: '#1d4ed8' }}>天気を味方につけよう</span>
        </h2>
        <p style={{ fontSize: 15, color: '#64748b', marginBottom: 34 }}>クレジットカード不要 · 30秒で登録完了</p>
        <Link href="/signup" style={{ display: 'inline-flex', padding: '16px 48px', borderRadius: 16, background: '#1d4ed8', color: '#fff', fontSize: 16, fontWeight: 900, textDecoration: 'none', boxShadow: '0 8px 24px rgba(29,78,216,0.35)', letterSpacing: '-0.01em' }}>
          無料でアカウントを作成 →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #e9ecf0', padding: '28px 48px', background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <Logo dark={false} size={24}/>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['料金','/pricing'],['ログイン','/login'],['新規登録','/signup']].map(([l,h]) => (
            <Link key={h} href={h} style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>{l}</Link>
          ))}
        </div>
      </footer>
    </main>
  )
}
