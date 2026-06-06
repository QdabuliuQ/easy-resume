import type { Metadata } from 'next';
import {
  BAIDU_SITE_VERIFICATION,
  BING_SITE_VERIFICATION,
  BYTEDANCE_SITE_VERIFICATION,
  GOOGLE_SITE_VERIFICATION,
  SO360_SITE_VERIFICATION,
  SHENMA_SITE_VERIFICATION,
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

function buildOpenGraph(
  locale: string,
  t: SiteT,
  opts: { title: string; description: string; url: string },
) {
  const siteName = getSiteName(locale);
  const ogPreviewImage = getSiteOgPreviewImage();
  return {
    title: opts.title,
    description: opts.description,
    type: 'website' as const,
    locale: locale === 'en' ? 'en_US' : 'zh_CN',
    siteName,
    url: opts.url,
    images: [
      {
        url: ogPreviewImage,
        width: SITE_OG_PREVIEW_WIDTH,
        height: SITE_OG_PREVIEW_HEIGHT,
        alt: t('ogImageAlt', { siteName }),
      },
    ],
  };
}

export function buildBaseSiteMetadata(locale: string, t: SiteT): Metadata {
  const siteName = getSiteName(locale);
  const title = `${siteName}-${t('titleDefault')}`;
  const description = t('description');
  const originBase = getSiteUrl().href.replace(/\/$/, '');
  const ogPreviewImage = getSiteOgPreviewImage();
  const pageUrl = `${originBase}/${locale}`;
  return {
    title: { default: title, template: `%s | ${siteName}` },
    description,
    openGraph: buildOpenGraph(locale, t, { title, description, url: pageUrl }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogPreviewImage],
    },
  };
}

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
  const pageUrl = `${originBase}/${locale}`;
  return {
    ...buildBaseSiteMetadata(locale, t),
    keywords,
    alternates: { canonical: `./` },
    verification: { google: GOOGLE_SITE_VERIFICATION },
    other: {
      thumbnail: ogPreviewImage,
      'baidu-site-verification': BAIDU_SITE_VERIFICATION,
      'msvalidate.01': BING_SITE_VERIFICATION,
      'sogou_site_verification': SOGOU_SITE_VERIFICATION,
      'bytedance-verification-code': BYTEDANCE_SITE_VERIFICATION,
      '360-site-verification': SO360_SITE_VERIFICATION,
      'shenma-site-verification': SHENMA_SITE_VERIFICATION,
    },
    openGraph: buildOpenGraph(locale, t, { title, description, url: pageUrl }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogPreviewImage],
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
  const ogPreviewImage = getSiteOgPreviewImage();
  return {
    title,
    description,
    alternates: { canonical: canonicalEdit },
    openGraph: buildOpenGraph(locale, t, {
      title,
      description,
      url: canonicalEdit,
    }),
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogPreviewImage],
    },
  };
}
