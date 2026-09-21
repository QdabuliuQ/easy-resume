import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ShareResumeView from '@/views/share/ShareResumeView';
import { getPublicShareResume } from '@/lib/shareResume';

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

export default async function ShareResumePage({
  params,
}: {
  params: { locale: string; token: string };
}) {
  setRequestLocale(params.locale);
  const result = await getPublicShareResume(params.token);
  const status = result.ok ? 'ok' : result.code === 'expired' || result.status === 410 ? 'expired' : 'invalid';
  return <ShareResumeView status={status} config={result.ok ? result.content : null} />;
}
