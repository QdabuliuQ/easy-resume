'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { logo } from '@/lib/brandAssets';

const pulse = 'animate-pulse bg-fg/[0.08] motion-reduce:animate-none';

function ShareResumeSkeleton() {
  return (
    <div
      className='w-full max-w-[720px] overflow-hidden rounded-lg bg-white shadow-[0_8px_30px_rgb(0_0_0/0.08)]'
      role='status'
      aria-busy='true'
    >
      <div className='space-y-6 p-6 sm:p-8' aria-hidden>
        <div className='flex items-start gap-4'>
          <div className={`size-16 shrink-0 rounded-full sm:size-[72px] ${pulse}`} />
          <div className='min-w-0 flex-1 space-y-2.5 pt-1'>
            <div className={`h-5 w-36 rounded-md ${pulse}`} />
            <div className={`h-3.5 w-48 max-w-full rounded-md ${pulse}`} />
            <div className={`h-3 w-40 max-w-full rounded-md ${pulse}`} />
          </div>
        </div>
        <div className='space-y-2'>
          <div className={`h-3.5 w-20 rounded-md ${pulse}`} />
          <div className={`h-3 w-full rounded-md ${pulse}`} />
          <div className={`h-3 w-[92%] rounded-md ${pulse}`} />
          <div className={`h-3 w-[78%] rounded-md ${pulse}`} />
        </div>
        {[0, 1].map((section) => (
          <div key={section} className='space-y-3'>
            <div className={`h-3.5 w-24 rounded-md ${pulse}`} />
            <div className='space-y-2 rounded-lg border border-fg/[0.06] p-3'>
              <div className='flex justify-between gap-3'>
                <div className={`h-3.5 w-28 rounded-md ${pulse}`} />
                <div className={`h-3 w-20 rounded-md ${pulse}`} />
              </div>
              <div className={`h-3 w-full rounded-md ${pulse}`} />
              <div className={`h-3 w-[88%] rounded-md ${pulse}`} />
              <div className={`h-3 w-[70%] rounded-md ${pulse}`} />
            </div>
          </div>
        ))}
        <div className='space-y-2'>
          <div className={`h-3.5 w-16 rounded-md ${pulse}`} />
          <div className='flex flex-wrap gap-2'>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-7 w-16 rounded-full ${pulse}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ResumeImageExportPage = dynamic(
  () => import('@/views/export/resumeImageExportPage'),
  { ssr: false, loading: () => <ShareResumeSkeleton /> },
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

    let ro: ResizeObserver | null = null;
    let cancelled = false;
    let raf = 0;

    const syncFromPage = (page: HTMLElement) => {
      const w = page.offsetWidth || 794;
      const h = page.offsetHeight;
      const avail = Math.min(wrap.clientWidth || SHARE_RESUME_MAX_W, SHARE_RESUME_MAX_W);
      setScale(Math.min(1, avail / w));
      setSize({ w, h });
    };

    const ensureObserver = (page: HTMLElement) => {
      if (ro) return;
      ro = new ResizeObserver(() => syncFromPage(page));
      ro.observe(page);
      ro.observe(wrap);
    };

    const tryAttach = () => {
      if (cancelled) return;
      const page = inner.querySelector('[data-resume-export-page]') as HTMLElement | null;
      if (!page) {
        raf = requestAnimationFrame(tryAttach);
        return;
      }
      syncFromPage(page);
      ensureObserver(page);
    };

    tryAttach();
    const mo = new MutationObserver(tryAttach);
    mo.observe(inner, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      mo.disconnect();
      ro?.disconnect();
    };
  }, [config]);

  return (
    <div ref={wrapRef} className='flex w-full max-w-[720px] justify-center'>
      <div
        className='overflow-hidden rounded-lg shadow-[0_8px_30px_rgb(0_0_0/0.08)]'
        style={{
          width: size.h ? size.w * scale : '100%',
          height: size.h ? size.h * scale : undefined,
          colorScheme: 'light',
        }}
      >
        <div
          ref={innerRef}
          className='origin-top-left'
          style={{
            transform: `scale(${scale})`,
            width: size.w,
            ...(size.h ? undefined : { minHeight: 200 }),
          }}
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
          <>
            <span className='sr-only'>{t('loading')}</span>
            <ShareResumeSkeleton />
          </>
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
              className='mt-2 text-sm font-medium hover:underline'
              style={{ color: 'var(--color-primary)' }}
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
