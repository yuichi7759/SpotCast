import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '料金プラン',
  description:
    'SpotCastの料金プラン。無料プラン（3ポイント・7日予報）と月額980円のStandardプラン（ポイント無制限・14日予報・全機能）。クレジットカード不要で今すぐ始められます。',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: '料金プラン | SpotCast',
    description: '無料で始められる気象サービス。Standardプランは月額980円でポイント無制限・14日予報・全機能。',
    url: '/pricing',
  },
}

// 料金ページのFAQを構造化データ（FAQPage）として提供 — AI回答エンジン・検索に有効
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'クレジットカードなしで始められますか？',
      acceptedAnswer: { '@type': 'Answer', text: 'はい。無料プランはクレジットカード不要です。Standardプランへのアップグレード時に決済情報をご入力いただきます。' },
    },
    {
      '@type': 'Question',
      name: 'いつでもキャンセルできますか？',
      acceptedAnswer: { '@type': 'Answer', text: 'はい。Standardプランはいつでもキャンセルでき、次回更新日まで引き続きご利用いただけます。' },
    },
    {
      '@type': 'Question',
      name: 'ポイントとは何ですか？',
      acceptedAnswer: { '@type': 'Answer', text: '地図上で登録した任意の場所のことです。農地・工場・観測地点・お気に入りスポットなど、どんな場所でも登録できます。' },
    },
    {
      '@type': 'Question',
      name: 'Best Day機能とは何ですか？',
      acceptedAnswer: { '@type': 'Answer', text: '登録したポイントごとに、向こう7〜14日間の「晴れに最適な日」や「雨が期待できる日」をスコアで可視化する機能です。複数ポイントを横並びに比較できます。' },
    },
  ],
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  )
}
