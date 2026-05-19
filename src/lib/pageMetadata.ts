import type { Metadata } from 'next';
import { BAIDU_SITE_VERIFICATION, SITE_NAME, getSiteUrl } from '@/lib/siteMeta';

type SiteT = (key: string, values?: Record<string, string>) => string;

export function buildHomeMetadata(locale: string, t: SiteT): Metadata {
  const title = t('titleDefault');
  const description = t('description');
  const originBase = getSiteUrl().href.replace(/\/$/, '');
  const keywords = t('keywords')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    keywords,
    alternates: { canonical: `./` },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      siteName: SITE_NAME,
      url: `${originBase}/${locale}`,
      images: [
        {
          url: `${originBase}/preview.png`,
          width: 1200,
          height: 630,
          alt: t('ogImageAlt', { siteName: SITE_NAME }),
        },
      ],
    },
    twitter: { card: 'summary_large_image', title, description },
    other: { 'baidu-site-verification': BAIDU_SITE_VERIFICATION },
  };
}

export function buildEditMetadata(locale: string, t: SiteT): Metadata {
  const title = t('editTitle');
  const description = t('editDescription');
  const originBase = getSiteUrl().href.replace(/\/$/, '');
  const canonicalEdit = `${originBase}/${locale}/edit`;
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: canonicalEdit },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      siteName: SITE_NAME,
      url: canonicalEdit,
    },
    twitter: { card: 'summary', title: `${title} | ${SITE_NAME}`, description },
  };
}
