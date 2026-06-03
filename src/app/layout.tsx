import type { Metadata } from 'next'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'
import LocaleProvider from '@/components/LocaleProvider'

export const metadata: Metadata = {
  title: 'SpotCast — 気になる場所の天気をワンクリックで',
  description: '地図上でポイントを登録するだけ。お好きな場所のリアルタイム天気・14日予報・雨雲レーダーをすぐ確認。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">
        <ThemeProvider><LocaleProvider>{children}</LocaleProvider></ThemeProvider>
      </body>
    </html>
  )
}
