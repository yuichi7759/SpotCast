import type { MetadataRoute } from 'next'

const SITE_URL = 'https://spotcast.evident-ai.org'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 認証必須・APIなど非公開領域はクロール対象外
        disallow: ['/dashboard', '/settings', '/support', '/chat', '/documents', '/api/', '/auth/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
