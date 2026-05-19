import { LocaleHtmlLang } from '@/components/localeHtmlLang';
import { VersionUpdateNotifier } from '@/components/versionUpdateNotifier';
import { siteJsonLdGraph } from '@/lib/siteMeta';
import { routing } from '@/i18n/routing';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
