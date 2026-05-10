import type { MetadataRoute } from 'next';
import { getCanonicalSiteBase } from '@/lib/canonicalSiteBase';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getCanonicalSiteBase();
  const now = new Date();
  return ['zh', 'en'].map((locale) => ({
    url: `${base}/${locale}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
}
