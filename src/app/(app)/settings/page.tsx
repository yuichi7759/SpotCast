'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/components/ThemeProvider'
import { MARKER_SIZE_OPTIONS, loadMarkerSize, saveMarkerSize, type MarkerSize } from '@/lib/markerSize'
import { loadWeatherIcons, saveWeatherIcons } from '@/lib/weatherIconsPref'
import { MARKER_ZOOM_OPTIONS, loadMarkerZoom, saveMarkerZoom } from '@/lib/markerZoomPref'
import { useLocale } from '@/components/LocaleProvider'
import { LOCALES } from '@/lib/i18n/dictionaries'

export default function SettingsPage() {
  const [email, setEmail]         = useState('')
  const [plan, setPlan]           = useState<'free' | 'pro'>('free')
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)
  const [markerSize, setMarkerSize] = useState<MarkerSize>('md')
  const [wxIcons, setWxIcons]       = useState(true)
  const [markerZoom, setMarkerZoom] = useState(12)
  const { theme, toggle } = useTheme()
  const { locale, setLocale, t } = useLocale()
  const router = useRouter()

  // Show success banner if redirected from Stripe
  const [upgraded, setUpgraded] = useState(false)
  const isUpgradedReturn = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('upgraded') === '1'

  useEffect(() => { setMarkerSize(loadMarkerSize()); setWxIcons(loadWeatherIcons()); setMarkerZoom(loadMarkerZoom()) }, [])

  useEffect(() => {
    if (isUpgradedReturn) {
      setUpgraded(true)
      window.history.replaceState({}, '', '/settings')
    }

    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user
      if (!user) return
      setEmail(user.email ?? '')

      // Webhookが遅れる場合があるので ?upgraded=1 の場合はリトライ
      let retries = isUpgradedReturn ? 5 : 1
      while (retries-- > 0) {
        const { data: row } = await supabase
          .from('users').select('plan').eq('id', user.id).single()
        const p = (row?.plan ?? 'free') as 'free' | 'pro'
        setPlan(p)
        if (p === 'pro' || !isUpgradedReturn) break
        await new Promise(r => setTimeout(r, 2000)) // 2秒待ってリトライ
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpgrade() {
    setUpgrading(true)
    setUpgradeError('')
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      setUpgradeError(data.error ?? t('common.error'))
    } catch {
      setUpgradeError(t('common.commError'))
    } finally {
      setUpgrading(false)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isLight = theme === 'light'
  const isPro = plan === 'pro'

  const surfaceBg   = isLight ? '#fff' : 'rgba(18,24,36,0.95)'
  const borderColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'
  const textPrimary = isLight ? '#111' : '#f0f0f0'
  const textMuted   = isLight ? '#666' : 'rgba(255,255,255,0.4)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: isLight ? '#f5f5f7' : '#080c14', color: textPrimary }}>

      {/* Header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: `1px solid ${borderColor}`,
        background: isLight ? '#fff' : 'rgba(8,12,20,0.95)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 8, border: `1px solid ${borderColor}`,
            background: 'transparent', cursor: 'pointer',
            color: textMuted, flexShrink: 0, transition: 'all 0.15s',
          }}
        >
          <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9,2 4,7 9,12"/>
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{t('settings.title')}</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Upgrade success banner */}
        {upgraded && (
          <div style={{
            marginBottom: 20, padding: '12px 16px', borderRadius: 12,
            background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)',
            color: '#fbbf24', fontSize: 13, fontWeight: 700,
          }}>
            ⚡ {t('settings.upgradeDone')}
          </div>
        )}

        {/* Account */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: textMuted, marginBottom: 10 }}>
            {t('settings.account')}
          </div>
          <div style={{ background: surfaceBg, border: `1px solid ${borderColor}`, borderRadius: 14, overflow: 'hidden' }}>
            {/* Email */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${borderColor}` }}>
              <div style={{ fontSize: 11, color: textMuted, marginBottom: 4 }}>{t('settings.email')}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{email || '—'}</div>
            </div>
            {/* Plan */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: textMuted, marginBottom: 8 }}>{t('settings.plan')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                  background: isPro ? 'rgba(251,191,36,0.15)' : `rgba(255,255,255,0.06)`,
                  border: `1px solid ${isPro ? 'rgba(251,191,36,0.5)' : borderColor}`,
                  color: isPro ? '#fbbf24' : textMuted,
                  letterSpacing: '0.05em',
                }}>
                  {isPro ? '⚡ STANDARD' : 'FREE'}
                </span>
                {!isPro && (
                  <div>
                    <button
                      onClick={handleUpgrade}
                      disabled={upgrading}
                      style={{
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        background: upgrading ? 'rgba(251,191,36,0.1)' : 'linear-gradient(135deg,#fbbf24,#f97316)',
                        border: 'none', borderRadius: 8, padding: '5px 14px',
                        color: upgrading ? 'rgba(255,255,255,0.4)' : '#000',
                        transition: 'all 0.15s',
                      }}
                    >
                      {upgrading ? t('common.processing') : t('settings.upgradeCta')}
                    </button>
                    {upgradeError && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#f87171' }}>⚠️ {upgradeError}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: textMuted, marginBottom: 10 }}>
            {t('settings.appearance')}
          </div>
          <div style={{ background: surfaceBg, border: `1px solid ${borderColor}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${borderColor}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t('settings.theme')}</div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
                  {isLight ? t('settings.themeLight') : t('settings.themeDark')}
                </div>
              </div>
              <button
                onClick={toggle}
                style={{
                  width: 48, height: 26, borderRadius: 999,
                  background: isLight ? '#3b82f6' : '#334155',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 4,
                  left: isLight ? 26 : 4,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 0.2s',
                }}/>
              </button>
            </div>
            {/* マーカーサイズ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: 12, borderBottom: `1px solid ${borderColor}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t('settings.markerSize')}</div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{t('settings.markerSizeHint')}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {MARKER_SIZE_OPTIONS.map(opt => {
                  const active = markerSize === opt.id
                  const labelKey = 'settings.size' + opt.id.charAt(0).toUpperCase() + opt.id.slice(1)
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { setMarkerSize(opt.id); saveMarkerSize(opt.id) }}
                      style={{
                        minWidth: 44, padding: '6px 10px', borderRadius: 8,
                        background: active ? (isLight ? '#3b82f6' : 'rgba(59,130,246,0.25)') : (isLight ? '#eef1f5' : 'rgba(255,255,255,0.06)'),
                        border: `1px solid ${active ? '#3b82f6' : borderColor}`,
                        color: active ? (isLight ? '#fff' : '#93c5fd') : textMuted,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {t(labelKey)}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* 地図に天気アイコンを表示 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: 12, borderBottom: `1px solid ${borderColor}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t('settings.wxIcons')}</div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{t('settings.wxIconsHint')}</div>
              </div>
              <button
                onClick={() => { const v = !wxIcons; setWxIcons(v); saveWeatherIcons(v) }}
                style={{
                  width: 48, height: 26, borderRadius: 999, flexShrink: 0,
                  background: wxIcons ? '#3b82f6' : (isLight ? '#cbd5e1' : '#334155'),
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 4, left: wxIcons ? 26 : 4,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 0.2s',
                }}/>
              </button>
            </div>
            {/* クリック時のズーム */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: 12, borderBottom: `1px solid ${borderColor}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t('settings.clickZoom')}</div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{t('settings.clickZoomHint')}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {MARKER_ZOOM_OPTIONS.map(opt => {
                  const active = markerZoom === opt.zoom
                  const labelKey = 'settings.zoom' + opt.id.charAt(0).toUpperCase() + opt.id.slice(1)
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { setMarkerZoom(opt.zoom); saveMarkerZoom(opt.zoom) }}
                      style={{
                        minWidth: 44, padding: '6px 10px', borderRadius: 8,
                        background: active ? (isLight ? '#3b82f6' : 'rgba(59,130,246,0.25)') : (isLight ? '#eef1f5' : 'rgba(255,255,255,0.06)'),
                        border: `1px solid ${active ? '#3b82f6' : borderColor}`,
                        color: active ? (isLight ? '#fff' : '#93c5fd') : textMuted,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {t(labelKey)}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* 言語 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t('lang.label')}</div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {LOCALES.map(l => {
                  const active = locale === l.id
                  return (
                    <button
                      key={l.id}
                      onClick={() => setLocale(l.id)}
                      style={{
                        minWidth: 64, padding: '6px 12px', borderRadius: 8,
                        background: active ? (isLight ? '#3b82f6' : 'rgba(59,130,246,0.25)') : (isLight ? '#eef1f5' : 'rgba(255,255,255,0.06)'),
                        border: `1px solid ${active ? '#3b82f6' : borderColor}`,
                        color: active ? (isLight ? '#fff' : '#93c5fd') : textMuted,
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {t(l.labelKey)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Session */}
        <section style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: textMuted, marginBottom: 10 }}>
            {t('settings.session')}
          </div>
          <div style={{ background: surfaceBg, border: `1px solid ${borderColor}`, borderRadius: 14, padding: '14px 16px' }}>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '8px 0',
                background: 'none', border: 'none',
                fontSize: 14, fontWeight: 600,
                color: loggingOut ? textMuted : '#f87171',
                cursor: loggingOut ? 'default' : 'pointer',
                transition: 'color 0.15s',
              }}
            >
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3"/>
                <polyline points="11,11 14,8 11,5"/>
                <line x1="14" y1="8" x2="6" y2="8"/>
              </svg>
              {loggingOut ? t('settings.logoutLoading') : t('settings.logout')}
            </button>
          </div>
        </section>

        {/* Support */}
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: textMuted, marginBottom: 10 }}>
            {t('settings.support')}
          </div>
          <div style={{ background: surfaceBg, border: `1px solid ${borderColor}`, borderRadius: 14, overflow: 'hidden' }}>
            <button
              onClick={() => router.push('/support')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '14px 16px',
                background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary }}>{t('settings.contact')}</div>
                <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>{t('settings.contactHint')}</div>
              </div>
              <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="5,2 10,7 5,12"/>
              </svg>
            </button>
          </div>
        </section>

      </div>
      </div>
    </div>
  )
}
