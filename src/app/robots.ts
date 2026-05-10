import type { MetadataRoute } from 'next';
import { getCanonicalSiteBase } from '@/lib/canonicalSiteBase';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getCanonicalSiteBase();
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
