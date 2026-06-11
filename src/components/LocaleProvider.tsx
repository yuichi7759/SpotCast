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

export default function LocaleProvider({ children, initialLocale = 'ja' }: { children: React.ReactNode; initialLocale?: Locale }) {
  // 初期値はサーバー判定（cookie/Accept-Language）に合わせる。
  // これでSSRの本文が <html lang> と一致し、英語ブラウザで日本語が一瞬出る不具合を防ぐ。
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    // 手動で選んだ言語(保存値)があればそれを最優先で上書き。
    // 未設定時はサーバーが既にAccept-Languageで判定済みなので再判定しない（二重判定の不整合防止）。
    const saved = localStorage.getItem(LOCALE_KEY) as Locale | null
    if (saved && saved in dictionaries && saved !== locale) {
      setLocaleState(saved)
      document.documentElement.lang = saved
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
