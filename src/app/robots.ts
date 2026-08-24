import type { MetadataRoute } from 'next'

const siteUrl = 'https://www.hobbygo.com.tw'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 依賴 session/登入狀態的頁面，對搜尋引擎沒有索引價值
      disallow: ['/cast', '/result', '/history', '/profile', '/api/', '/auth/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
