import { cookies, headers } from 'next/headers'
import { dictionaries, type Locale } from './dictionaries'

// サーバー側で言語を判定（cookie優先→Accept-Language）。LP等のSSRで使用しSEO対応。
export async function getLocale(): Promise<Locale> {
  try {
    const c = await cookies()
    const saved = c.get('spotcast_locale')?.value
    if (saved === 'ja' || saved === 'en') return saved
  } catch {}
  try {
    const h = await headers()
    const al = (h.get('accept-language') ?? '').toLowerCase()
    if (al.startsWith('ja')) return 'ja'
  } catch {}
  return 'en'
}

export function st(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const d = dictionaries[locale] as Record<string, string>
  const fallback = dictionaries.ja as Record<string, string>
  let s = d[key] ?? fallback[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return s
}
