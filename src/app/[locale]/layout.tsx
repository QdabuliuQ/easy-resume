import type { Metadata } from 'next';
import { LocaleHtmlLang } from '@/components/localeHtmlLang';
import { VersionUpdateNotifier } from '@/components/versionUpdateNotifier';
import { getSiteOgPreviewImage } from '@/lib/brandAssets';
import { buildBaseSiteMetadata } from '@/lib/pageMetadata';
import { siteJsonLdGraph } from '@/lib/siteMeta';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
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
  return buildBaseSiteMetadata(locale, t);
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
          __html: JSON.stringify(
            siteJsonLdGraph({ locale, image: getSiteOgPreviewImage() }),
          ),
        }}
      />
      <VersionUpdateNotifier />
      {children}
    </NextIntlClientProvider>
  );
}
