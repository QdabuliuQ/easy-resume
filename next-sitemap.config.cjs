/** @type {import('next-sitemap').IConfig} */
/** `npm run build` 末尾 postbuild 执行；须在同一环境中设置 SITE_URL 或 NEXT_PUBLIC_SITE_URL，否则回退 localhost */
const siteUrl =
  process.env.SITE_URL?.trim()?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, '') ||
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