'use client';
import { observer } from 'mobx-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { resumeImportStore } from '@/mobx';

const OVERLAY_MS = 280;

function ResumeImportOverlay() {
  const t = useTranslations('Edit.header');
  const loading = resumeImportStore.loading;
  const status = resumeImportStore.statusText || t('importResumeParsing');
  const reduceMotion = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (loading) {
      setMounted(true);
      if (reduceMotion) {
        setShown(true);
        return;
      }
      const raf = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
  }, [loading, reduceMotion]);

  useEffect(() => {
    if (shown || !mounted) return;
    if (reduceMotion) {
      setMounted(false);
      return;
    }
    const timer = window.setTimeout(() => setMounted(false), OVERLAY_MS);
    return () => window.clearTimeout(timer);
  }, [shown, mounted, reduceMotion]);

  if (!mounted) return null;

  const motionCls = reduceMotion
    ? ''
    : 'transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.19,1,0.22,1)]';
  const backdropCls = `${motionCls} ${shown ? 'opacity-100' : 'opacity-0'}`;
  const panelCls = `${motionCls} ${shown ? 'scale-100 opacity-100 translate-y-0' : 'scale-[0.96] opacity-0 translate-y-2'}`;

  return (
    <div
      className={`absolute inset-0 z-[1500] flex items-center justify-center overflow-hidden bg-[linear-gradient(180deg,rgb(var(--surface-bg-rgb)/0.78)_0%,rgb(var(--surface-bg-rgb)/0.88)_100%)] backdrop-blur-[10px] ${shown ? 'pointer-events-auto' : 'pointer-events-none'} ${backdropCls}`}
      aria-live='polite'
      aria-busy={loading}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
    >
      <div className={`rounded-[22px] bg-gradient-primary p-px shadow-[0_24px_56px_rgb(var(--surface-bg-rgb)/0.42),0_0_0_1px_rgb(var(--surface-fg-rgb)/0.06)] ${panelCls}`}>
        <div className='flex min-w-[220px] flex-col items-center gap-4 rounded-[21px] bg-[var(--editor-shell-panel-strong)] px-10 py-8'>
          <span className='relative inline-flex size-12 items-center justify-center'>
            <span className='absolute inset-0 animate-spin rounded-full border-[3px] border-[color-mix(in_srgb,var(--color-primary-gradient-start)_22%,transparent)] border-t-[var(--color-primary)]' />
            <span className='size-2 rounded-full bg-gradient-primary shadow-[0_0_12px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]' />
          </span>
          <div className='flex flex-col items-center gap-1.5 text-center'>
            <span className='bg-gradient-primary bg-clip-text text-[14px] font-semibold text-transparent'>
              {t('importResume')}
            </span>
            <span className='max-w-[200px] text-[12px] leading-relaxed text-fg/55'>{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default observer(ResumeImportOverlay);
