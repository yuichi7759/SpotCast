'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { dictionaries, type Locale } from '@/lib/i18n/dictionaries'

const LOCALE_KEY = 'spotcast:locale'

type TFunc = (key: string, vars?: Record<string, string | number>) => string

interface Ctx {
  locale: Locale
  setLocale: (l: Locale) => void
  t: TFunc
}

const LocaleContext = createContext<Ctx>({
  locale: 'ja',
  setLocale: () => {},
  t: (k) => k,
})

export function useLocale() { return useContext(LocaleContext) }
export function useT(): TFunc { return useContext(LocaleContext).t }

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ja')

  useEffect(() => {
    // 1) 手動で選んだ言語があれば最優先
    const saved = localStorage.getItem(LOCALE_KEY) as Locale | null
    if (saved && saved in dictionaries) {
      setLocaleState(saved)
      document.documentElement.lang = saved
      return
    }
    // 2) 未設定ならブラウザの言語から自動判定（保存はしない＝手動切替で上書き可）
    const langs = navigator.languages ?? [navigator.language]
    const isJa = langs.some(l => l?.toLowerCase().startsWith('ja'))
    const detected: Locale = isJa ? 'ja' : 'en'
    setLocaleState(detected)
    document.documentElement.lang = detected
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem(LOCALE_KEY, l) } catch {}
    // サーバー側（LP等のSSR）でも反映できるよう cookie にも保存
    try { document.cookie = `spotcast_locale=${l}; path=/; max-age=31536000; samesite=lax` } catch {}
    document.documentElement.lang = l
  }, [])

  const t = useCallback<TFunc>((key, vars) => {
    const dict = dictionaries[locale] as Record<string, string>
    const fallback = dictionaries.ja as Record<string, string>
    let s = dict[key] ?? fallback[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
    }
    return s
  }, [locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}
