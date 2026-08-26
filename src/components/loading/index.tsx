'use client';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

export default memo(function Loading() {
  const t = useTranslations('Loading');
  return (
    <div className='absolute left-0 top-0 z-[999] flex h-screen w-screen items-center justify-center bg-[var(--editor-shell-bg,#fff)]'>
      <div className='flex flex-col items-center'>
        <span
          className='h-8 w-8 animate-spin rounded-full border-2 border-fg/15 border-t-[var(--color-primary)]'
          aria-hidden
        />
        <span className='mt-2.5 text-[15px] text-fg/70'>{t('text')}</span>
      </div>
    </div>
  );
});
