import type { MetadataRoute } from 'next';
import { getCanonicalSiteBase } from '@/lib/canonicalSiteBase';
import { SEO_SITEMAP_ENTRIES } from '@/lib/seoRoutes';

export const dynamic = 'force-dynamic';

const LASTMOD = '2026-05-19';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getCanonicalSiteBase();
  return SEO_SITEMAP_ENTRIES.map(({ locale, path, changeFrequency, priority }) => ({
    url: `${base}/${locale}${path}`,
    lastModified: LASTMOD,
    changeFrequency,
    priority,
  }));
}
