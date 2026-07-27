'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Spin } from 'antd';
import { logo } from '@/lib/brandAssets';

const ResumeImageExportPage = dynamic(
  () => import('@/views/export/resumeImageExportPage'),
  { ssr: false, loading: () => <Spin tip='…' /> },
);

type Status = 'loading' | 'ok' | 'expired' | 'invalid';

const SHARE_RESUME_MAX_W = 720;

function ShareResumeFrame({ config }: { config: unknown }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [size, setSize] = useState({ w: 794, h: 0 });

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const page = inner.querySelector('[data-resume-export-page]') as HTMLElement | null;
    if (!page) return;
    const sync = () => {
      const w = page.offsetWidth || 794;
      const h = page.offsetHeight;
      const avail = Math.min(wrap.clientWidth, SHARE_RESUME_MAX_W);
      setScale(Math.min(1, avail / w));
      setSize({ w, h });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(page);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [config]);

  return (
    <div ref={wrapRef} className='flex w-full max-w-[720px] justify-center'>
      <div
        className='overflow-hidden rounded-lg shadow-[0_8px_30px_rgb(0_0_0/0.08)]'
        style={{
          width: size.w * scale,
          height: size.h ? size.h * scale : undefined,
          colorScheme: 'light',
        }}
      >
        <div
          ref={innerRef}
          className='origin-top-left'
          style={{ transform: `scale(${scale})`, width: size.w }}
        >
          <ResumeImageExportPage config={config} />
        </div>
      </div>
    </div>
  );
}

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
      <Link
        href='/'
        prefetch={false}
        className='fixed left-4 top-4 z-10 flex items-center gap-2 rounded-lg outline-none ring-[var(--text-strong)]/35 focus-visible:ring-2'
      >
        <Image
          src={logo}
          alt={t('logoAlt')}
          width={32}
          height={32}
          className='h-8 w-8 object-contain'
          priority
        />
        <span className='text-[15px] font-semibold tracking-wide text-[var(--color-primary)]'>
          {t('brandName')}
        </span>
      </Link>
      <main className='mx-auto flex w-full flex-col items-center px-3 pb-8 pt-16 sm:px-6'>
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
        {status === 'ok' && config ? <ShareResumeFrame config={config} /> : null}
      </main>
    </div>
  );
}
