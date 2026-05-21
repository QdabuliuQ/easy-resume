import type { Metadata } from 'next';
import {
  BAIDU_SITE_VERIFICATION,
  BING_SITE_VERIFICATION,
  BYTEDANCE_SITE_VERIFICATION,
  GOOGLE_SITE_VERIFICATION,
  SOGOU_SITE_VERIFICATION,
  SITE_NAME,
  SITE_OG_PREVIEW_HEIGHT,
  SITE_OG_PREVIEW_IMAGE,
  SITE_OG_PREVIEW_WIDTH,
  getSiteUrl,
} from '@/lib/siteMeta';

type SiteT = (key: string, values?: Record<string, string>) => string;

export function buildHomeMetadata(locale: string, t: SiteT): Metadata {
  const title = `${SITE_NAME}-${t('titleDefault')}`;
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
          url: SITE_OG_PREVIEW_IMAGE,
          width: SITE_OG_PREVIEW_WIDTH,
          height: SITE_OG_PREVIEW_HEIGHT,
          alt: t('ogImageAlt', { siteName: SITE_NAME }),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SITE_OG_PREVIEW_IMAGE],
    },
    verification: { google: GOOGLE_SITE_VERIFICATION },
    other: {
      thumbnail: SITE_OG_PREVIEW_IMAGE,
      'baidu-site-verification': BAIDU_SITE_VERIFICATION,
      'msvalidate.01': BING_SITE_VERIFICATION,
      'sogou_site_verification': SOGOU_SITE_VERIFICATION,
      'bytedance-verification-code': BYTEDANCE_SITE_VERIFICATION,
    },
  };
}

export function buildEditMetadata(locale: string, t: SiteT): Metadata {
  const suffix = t('editTitle');
  const description = t('editDescription');
  const title = `${SITE_NAME}-${suffix}`;
  const originBase = getSiteUrl().href.replace(/\/$/, '');
  const canonicalEdit = `${originBase}/${locale}/edit`;
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: canonicalEdit },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      siteName: SITE_NAME,
      url: canonicalEdit,
    },
    twitter: { card: 'summary', title, description },
  };
}
