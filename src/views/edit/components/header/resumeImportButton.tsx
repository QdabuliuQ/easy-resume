'use client';
import { Scan } from '@icon-park/react';
import { observer } from 'mobx-react';
import { useTranslations } from 'next-intl';
import { resumeImportStore } from '@/mobx';
import { useResumeImport } from '@/views/edit/hooks/useResumeImport';

type ResumeImportButtonProps = {
  disabled?: boolean;
  exportGradId: string;
};

function ResumeImportButton({ disabled, exportGradId }: ResumeImportButtonProps) {
  const t = useTranslations('Edit.header');
  const { contextHolder, fileRef, onFileChange, confirmThenPick, loading } = useResumeImport();
  const chipOuter =
    'group rounded-2xl bg-gradient-primary p-px shadow-[0_2px_12px_rgb(0_0_0/0.18)] transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100';
  const chipInner =
    'flex min-h-9 items-center justify-center gap-1.5 rounded-[15px] bg-[var(--float-btn-bg)] px-3.5 py-2 transition-colors group-hover:bg-[var(--float-btn-bg-hover)]';
  return (
    <>
      {contextHolder}
      <input
        ref={fileRef}
        type='file'
        accept='.pdf,application/pdf,image/jpeg,image/png,image/webp'
        className='sr-only'
        aria-hidden
        onChange={onFileChange}
      />
      <button
        type='button'
        disabled={disabled || loading}
        onClick={confirmThenPick}
        className={`cursor-pointer ${chipOuter}`}
      >
        <span className={chipInner}>
          <span className='inline-flex size-5 shrink-0 items-center justify-center' aria-hidden>
            {loading ? (
              <span className='inline-block size-4 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--color-primary-gradient-start)_35%,transparent)] border-t-[var(--color-primary)]' />
            ) : (
              <Scan theme='outline' size={20} fill={`url(#${exportGradId})`} />
            )}
          </span>
          <span className='bg-gradient-primary bg-clip-text text-center text-[12px] font-semibold leading-snug text-transparent whitespace-nowrap'>
            {loading && resumeImportStore.statusText ? resumeImportStore.statusText : t('importResume')}
          </span>
        </span>
      </button>
    </>
  );
}

export default observer(ResumeImportButton);
