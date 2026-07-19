import type { Metadata } from 'next';
import { fetchGithubRepoStars } from '@/lib/githubRepoStars';
import { buildHomeMetadata } from '@/lib/pageMetadata';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HomeClient from '../home-client';

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
  const githubStars = await fetchGithubRepoStars();
  return <HomeClient githubStars={githubStars} />;
}
