'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Spin } from 'antd';
import { logo } from '@/lib/brandAssets';

const ResumeImageExportPage = dynamic(
  () => import('@/views/export/resumeImageExportPage'),
  { ssr: false, loading: () => <Spin tip='…' /> },
);

type Status = 'loading' | 'ok' | 'expired' | 'invalid';

export default function ShareResumeView({ token }: { token: string }) {
  const t = useTranslations('Share');
  const [status, setStatus] = useState<Status>('loading');
  const [config, setConfig] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/resume/share/${encodeURIComponent(token)}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 410 || data?.code === 'expired') {
          setStatus('expired');
          return;
        }
        if (!res.ok || !data?.content) {
          setStatus('invalid');
          return;
        }
        setConfig(data.content);
        setStatus('ok');
      } catch {
        if (!cancelled) setStatus('invalid');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className='min-h-dvh bg-[rgb(var(--surface-bg-rgb))] text-fg'>
      <header className='sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-fg/10 bg-[var(--float-btn-bg)] px-4 backdrop-blur-md'>
        <Link
          href='/'
          prefetch={false}
          className='flex items-center gap-2 outline-none ring-[var(--text-strong)]/35 focus-visible:ring-2 rounded-lg'
        >
          <Image
            src={logo}
            alt={t('logoAlt')}
            width={32}
            height={32}
            className='h-8 w-8 object-contain'
            priority
          />
          <span className='text-[15px] font-semibold tracking-wide'>{t('brandName')}</span>
        </Link>
      </header>
      <main className='mx-auto flex w-full max-w-[920px] flex-col items-center px-3 py-8 sm:px-6'>
        {status === 'loading' ? (
          <div className='flex min-h-[40vh] items-center justify-center'>
            <Spin tip={t('loading')} size='large' />
          </div>
        ) : null}
        {status === 'expired' || status === 'invalid' ? (
          <div className='flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-3 text-center'>
            <h1 className='text-xl font-semibold text-fg/90'>
              {status === 'expired' ? t('expiredTitle') : t('invalidTitle')}
            </h1>
            <p className='text-sm text-fg/55'>
              {status === 'expired' ? t('expiredDesc') : t('invalidDesc')}
            </p>
            <Link
              href='/'
              prefetch={false}
              className='mt-2 text-sm font-medium text-[var(--color-primary)] hover:underline'
            >
              {t('backHome')}
            </Link>
          </div>
        ) : null}
        {status === 'ok' && config ? (
          <div className='w-full overflow-x-auto rounded-lg shadow-[0_8px_30px_rgb(0_0_0/0.08)]'>
            <ResumeImageExportPage config={config} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
