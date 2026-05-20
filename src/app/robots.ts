import type { MetadataRoute } from 'next';
import { getCanonicalSiteBase } from '@/lib/canonicalSiteBase';

export const dynamic = 'force-dynamic';

function hostFromBase(base: string): string {
  try {
    return new URL(base).host;
  } catch {
    return base.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getCanonicalSiteBase();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/test/', '/draft/'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: hostFromBase(base),
  };
}
