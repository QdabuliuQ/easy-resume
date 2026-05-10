import { LocaleHtmlLang } from '@/components/localeHtmlLang';
import { VersionUpdateNotifier } from '@/components/versionUpdateNotifier';
import {
  SITE_NAME,
  getSiteUrl,
  siteJsonLdGraph,
} from '@/lib/siteMeta';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'Site' });
  const title = t('titleDefault');
  const description = t('description');
  const originBase = getSiteUrl().href.replace(/\/$/, '');
  const keywords = t('keywords')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    keywords,
    alternates: {
      canonical: './',
    },
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
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlLang />
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(siteJsonLdGraph({ locale })),
        }}
      />
      <VersionUpdateNotifier />
      {children}
    </NextIntlClientProvider>
  );
}
