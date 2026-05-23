import type { MetadataRoute } from 'next';

export type SeoLocale = 'zh' | 'en';

export const SEO_SITEMAP_ENTRIES: {
  locale: SeoLocale;
  path: '' | '/edit';
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
}[] = [
  { locale: 'zh', path: '', changeFrequency: 'daily', priority: 1 },
  { locale: 'zh', path: '/edit', changeFrequency: 'daily', priority: 0.9 },
  { locale: 'en', path: '', changeFrequency: 'weekly', priority: 0.8 },
  { locale: 'en', path: '/edit', changeFrequency: 'weekly', priority: 0.7 },
];
