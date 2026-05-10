import type { Metadata } from 'next';
import { SITE_NAME, getSiteUrl } from '@/lib/siteMeta';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'Site' });
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
    twitter: {
      card: 'summary',
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function EditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  return children;
}
