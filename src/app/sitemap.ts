import type { MetadataRoute } from 'next';
import { SEO_SITEMAP_ENTRIES } from '@/lib/seoRoutes';
import { getSiteUrl } from '@/lib/siteMeta';

export const dynamic = 'force-static';

const LASTMOD = '2026-05-19';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().href.replace(/\/$/, '');
  return SEO_SITEMAP_ENTRIES.map(({ locale, path, changeFrequency, priority }) => ({
    url: `${base}/${locale}${path}`,
    lastModified: LASTMOD,
    changeFrequency,
    priority,
  }));
}
