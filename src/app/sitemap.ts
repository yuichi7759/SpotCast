import type { MetadataRoute } from 'next'

const SITE_URL = 'https://spotcast.evident-ai.org'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL,               changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/pricing`,  changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/signup`,   changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${SITE_URL}/login`,    changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/privacy`,  changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/terms`,    changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${SITE_URL}/tokusho`,  changeFrequency: 'yearly',  priority: 0.2 },
  ]
}
