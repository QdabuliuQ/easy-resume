import type { Metadata } from 'next';
import {
  BAIDU_SITE_VERIFICATION,
  BING_SITE_VERIFICATION,
  BYTEDANCE_SITE_VERIFICATION,
  GOOGLE_SITE_VERIFICATION,
  SOGOU_SITE_VERIFICATION,
  getSiteName,
  getSiteUrl,
} from '@/lib/siteMeta';
import {
  getSiteOgPreviewImage,
  SITE_OG_PREVIEW_HEIGHT,
  SITE_OG_PREVIEW_WIDTH,
} from '@/lib/brandAssets';

type SiteT = (key: string, values?: Record<string, string>) => string;

export function buildHomeMetadata(locale: string, t: SiteT): Metadata {
  const siteName = getSiteName(locale);
  const title = `${siteName}-${t('titleDefault')}`;
  const description = t('description');
  const originBase = getSiteUrl().href.replace(/\/$/, '');
  const ogPreviewImage = getSiteOgPreviewImage();
  const keywords = t('keywords')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    title: { default: title, template: `%s | ${siteName}` },
    description,
    keywords,
    alternates: { canonical: `./` },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      siteName,
      url: `${originBase}/${locale}`,
      images: [
        {
          url: ogPreviewImage,
          width: SITE_OG_PREVIEW_WIDTH,
          height: SITE_OG_PREVIEW_HEIGHT,
          alt: t('ogImageAlt', { siteName }),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogPreviewImage],
    },
    verification: { google: GOOGLE_SITE_VERIFICATION },
    other: {
      thumbnail: ogPreviewImage,
      'baidu-site-verification': BAIDU_SITE_VERIFICATION,
      'msvalidate.01': BING_SITE_VERIFICATION,
      'sogou_site_verification': SOGOU_SITE_VERIFICATION,
      'bytedance-verification-code': BYTEDANCE_SITE_VERIFICATION,
    },
  };
}

export function buildEditMetadata(locale: string, t: SiteT): Metadata {
  const siteName = getSiteName(locale);
  const suffix = t('editTitle');
  const description = t('editDescription');
  const title = `${siteName}-${suffix}`;
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
      siteName,
      url: canonicalEdit,
    },
    twitter: { card: 'summary', title, description },
  };
}
