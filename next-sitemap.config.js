/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://archi-ai.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/api/*',
    '/dashboard/*',
    '/auth/*',
    '/test',
    '/test-mobile',
    '/sentry-example-page',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/auth/'],
      },
    ],
  },
}
