/** @type {import('next-sitemap').IConfig} */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'http://localhost:3010/easy-resume';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  autoLastmod: true,
  changefreq: 'weekly',
  priority: 0.7,
  exclude: ['/zh/edit', '/zh/edit/*', '/en/edit', '/en/edit/*', '/api/*'],
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/' }],
  },
};