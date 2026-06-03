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
    const saved = (typeof window !== 'undefined'
      ? localStorage.getItem(LOCALE_KEY)
      : null) as Locale | null
    if (saved && saved in dictionaries) {
      setLocaleState(saved)
      document.documentElement.lang = saved
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try { localStorage.setItem(LOCALE_KEY, l) } catch {}
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
