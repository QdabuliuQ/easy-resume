import type { Metadata } from 'next';
import { buildHomeMetadata } from '@/lib/pageMetadata';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HomeClient from '../home-client';
import HomeBackdrop from '@/components/home/HomeBackdrop';
import HomeBrandMark from '@/components/home/HomeBrandMark';
import HomeTopNavActions from '@/components/home/HomeTopNavActions';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'Site' });
  return buildHomeMetadata(locale, t);
}

export default async function Page({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  // ponytail: 不阻塞首屏等 GitHub API；stars 由客户端补
  return (
    <HomeClient
      backdrop={<HomeBackdrop />}
      brand={<HomeBrandMark locale={params.locale} />}
      nav={<HomeTopNavActions />}
    />
  );
}
