import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import LocaleProvider from '@/components/LocaleProvider'

const SITE_URL = 'https://spotcast.evident-ai.org'
const TITLE = 'SpotCast — 気になる場所の天気をワンクリックで'
const DESCRIPTION =
  '地図をクリックするだけで、世界中の好きな場所の天気を登録・管理できる気象サービス。リアルタイム天気・最大14日予報・雨雲レーダー・複数地点のBest Day比較を、ひとつのダッシュボードで。'

export const metadata: Metadata = {
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
    locale: 'ja_JP',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'SpotCast — 気になる場所の天気をワンクリックで' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: { icon: '/favicon.ico', apple: '/favicon.ico' },
  category: 'weather',
}

// 構造化データ（JSON-LD）— 検索エンジン・AI回答エンジン向け
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'SpotCast',
      url: SITE_URL,
      logo: `${SITE_URL}/og.jpg`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'SpotCast',
      description: DESCRIPTION,
      inLanguage: 'ja',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'SpotCast',
      applicationCategory: 'WeatherApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      description: DESCRIPTION,
      offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'JPY' },
        { '@type': 'Offer', name: 'Standard', price: '980', priceCurrency: 'JPY' },
      ],
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider><LocaleProvider>{children}</LocaleProvider></ThemeProvider>
      </body>
    </html>
  )
}
