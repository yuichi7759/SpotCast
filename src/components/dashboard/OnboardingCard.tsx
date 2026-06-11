'use client'
import { useEffect, useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'

const KEY = 'spotcast:onboarded'

// 初回ログイン時だけ表示する、超シンプルな使い方カード（閉じたら二度と出ない）。
export default function OnboardingCard() {
  const { t } = useLocale()
  const [show, setShow] = useState(false)

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true) } catch {}
  }, [])

  function dismiss() {
    try { localStorage.setItem(KEY, '1') } catch {}
    setShow(false)
  }

  if (!show) return null

  const steps: [string, string, string][] = [
    ['📍', t('onb.s1'), t('onb.s1d')],
    ['🔍', t('onb.s2'), t('onb.s2d')],
    ['🌤', t('onb.s3'), t('onb.s3d')],
  ]

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 80,
        background: 'rgba(4,7,12,0.62)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(94%, 380px)', background: 'var(--dash-panel-solid, #0c111b)',
          border: '1px solid var(--dash-border, rgba(255,255,255,0.12))', borderRadius: 18,
          padding: '22px 20px 18px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          color: 'var(--dash-text, #fff)',
        }}
      >
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 3 }}>{t('onb.title')}</div>
        <div style={{ fontSize: 13, color: 'var(--dash-text-3, rgba(255,255,255,0.5))', marginBottom: 18 }}>{t('onb.sub')}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map(([icon, title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                background: 'var(--dash-surface2, rgba(255,255,255,0.06))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>{icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
                  <span style={{ color: 'var(--dash-accent, #3ecf8e)', marginRight: 6 }}>{i + 1}</span>{title}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--dash-text-3, rgba(255,255,255,0.55))', lineHeight: 1.5, marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={dismiss}
          style={{
            width: '100%', marginTop: 20, padding: '12px 0', borderRadius: 12,
            background: '#3ecf8e', border: 'none', color: '#06281a',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
          }}
        >
          {t('onb.cta')}
        </button>
      </div>
    </div>
  )
}
