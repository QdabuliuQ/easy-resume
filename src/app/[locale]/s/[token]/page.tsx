import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ShareResumeView from '@/views/share/ShareResumeView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'Share' });
  return {
    title: t('brandName'),
    robots: { index: false, follow: false },
  };
}

export default function ShareResumePage({
  params,
}: {
  params: { locale: string; token: string };
}) {
  setRequestLocale(params.locale);
  return <ShareResumeView token={params.token} />;
}
