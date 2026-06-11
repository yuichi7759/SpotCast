import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import LocaleProvider from '@/components/LocaleProvider'
import { Analytics } from '@vercel/analytics/next'
import { getLocale, st } from '@/lib/i18n/server'

const SITE_URL = 'https://spotcast.evident-ai.org'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const TITLE = st(locale, 'meta.title')
  const DESCRIPTION = st(locale, 'meta.desc')
  return {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s | SpotCast' },
  description: DESCRIPTION,
  applicationName: 'SpotCast',
  keywords: [
    'SpotCast', '天気', '天気予報', '複数地点', '雨雲レーダー', '14日予報',
    '気象', 'ピンポイント天気', '地図 天気', 'Best Day', '週間天気',
  ],
  authors: [{ name: 'SpotCast' }],
  creator: 'SpotCast',
  publisher: 'SpotCast',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'SpotCast',
    title: TITLE,
    description: DESCRIPTION,
    locale: locale === 'ja' ? 'ja_JP' : 'en_US',
    // OG画像は opengraph-image.tsx（動的生成）が自動付与される
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'weather',
  // Google Search Console のHTMLタグ確認用（任意・環境変数で設定）
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const desc = st(locale, 'meta.desc')
  // 構造化データ（JSON-LD）— 検索エンジン・AI回答エンジン向け
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'SpotCast', url: SITE_URL, logo: `${SITE_URL}/og.jpg` },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: 'SpotCast', description: desc, inLanguage: locale, publisher: { '@id': `${SITE_URL}/#organization` } },
      {
        '@type': 'SoftwareApplication', name: 'SpotCast', applicationCategory: 'WeatherApplication',
        operatingSystem: 'Web', url: SITE_URL, description: desc,
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'JPY' },
          { '@type': 'Offer', name: 'Standard', price: '980', priceCurrency: 'JPY' },
        ],
      },
    ],
  }
  return (
    <html lang={locale} className="h-full">
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider><LocaleProvider initialLocale={locale}>{children}</LocaleProvider></ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
