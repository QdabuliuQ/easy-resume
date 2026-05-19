import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/siteMeta';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl().href.replace(/\/$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/test/', '/draft/', '/*?*'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
