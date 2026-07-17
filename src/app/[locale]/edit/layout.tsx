import type { Metadata } from 'next';
import { AntdProvider } from '@/app/providers';
import { VersionUpdateNotifier } from '@/components/versionUpdateNotifier';
import { buildEditMetadata } from '@/lib/pageMetadata';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-static';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'Site' });
  return buildEditMetadata(locale, t);
}

export default async function EditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Site' });
  return (
    <AntdProvider>
      <h1 className='sr-only'>{t('editTitle')}</h1>
      <VersionUpdateNotifier />
      {children}
    </AntdProvider>
  );
}
