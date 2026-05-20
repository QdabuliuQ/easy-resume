'use client';

import { CloseOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { memo, useEffect } from 'react';
import MobileResumePreview from './resumePreview';

function MobilePreviewOverlay({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Edit.mobile');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className='fixed inset-0 z-[200] flex flex-col bg-[var(--overlay-scrim)]'>
      <div className='flex shrink-0 items-center justify-between border-b border-fg/10 bg-[var(--editor-shell-bg)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]'>
        <span className='text-sm font-semibold text-fg/90'>{t('navPreview')}</span>
        <button
          type='button'
          onClick={onClose}
          aria-label={t('closePreview')}
          className='flex h-9 w-9 items-center justify-center rounded-full border border-fg/14 text-fg/70'
        >
          <CloseOutlined />
        </button>
      </div>
      <div className='min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[var(--editor-shell-bg)] [-webkit-overflow-scrolling:touch]'>
        <MobileResumePreview />
      </div>
    </div>
  );
}

export default memo(MobilePreviewOverlay);
