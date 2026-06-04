import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SpotCast — 気になる場所の天気をワンクリックで',
    short_name: 'SpotCast',
    description: '地図から登録する、あなた専用の天気予報。リアルタイム天気・14日予報・雨雲レーダー。',
    start_url: '/',
    display: 'standalone',
    background_color: '#080c14',
    theme_color: '#1d4ed8',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  }
}
