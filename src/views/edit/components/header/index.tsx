'use client';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { memo, useId, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Button, Input } from 'antd';
import { useAppMessage } from '@/hooks/useAppMessage';
import { EditOutlined } from '@ant-design/icons';
import { FilePdf, DownPicture, FileCode } from '@icon-park/react';
import { configStore } from '@/mobx';
import defaultResume from '@/json/resume.defaults';
function Header() {
  const message = useAppMessage();
  const t = useTranslations('Edit.header');
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const ignoreNextBlur = useRef(false);
  const name = configStore.getConfig?.name ?? defaultResume.name;
  const exportGradId = `hdr-eg${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const exportChipOuter =
    'group rounded-2xl bg-gradient-primary p-px shadow-[0_2px_12px_rgb(0_0_0/0.18)] transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100';
  const exportChipInner =
    'flex min-h-9 items-center justify-center gap-1 rounded-[15px] bg-[var(--float-btn-bg)] px-3 py-2 transition-colors group-hover:bg-[var(--float-btn-bg-hover)]';
  const exportIconSlot = 'inline-flex size-5 shrink-0 items-center justify-center';
  const commit = () => {
    const trimmed = draft.trim();
    const base = configStore.getConfig ?? JSON.parse(JSON.stringify(defaultResume));
    configStore.setConfig({ ...base, name: trimmed || name });
    ignoreNextBlur.current = true;
    setEditing(false);
    queueMicrotask(() => {
      ignoreNextBlur.current = false;
    });
  };
  const cancel = () => {
    ignoreNextBlur.current = true;
    setEditing(false);
    queueMicrotask(() => {
      ignoreNextBlur.current = false;
    });
  };
  const startEdit = () => {
    setDraft(name);
    setEditing(true);
  };
  const onBlur = () => {
    if (ignoreNextBlur.current) return;
    commit();
  };
  const snapshotForExport = () => {
    const raw = configStore.getConfig;
    if (!raw) return JSON.parse(JSON.stringify(defaultResume));
    return JSON.parse(
      JSON.stringify({
        ...raw,
        globalStyle: configStore.mergedGlobalStyle,
        exportPages: configStore.getExportPages,
      }),
    );
  };
  const exportPdf = async () => {
    if (typeof window === 'undefined' || pdfLoading || imageLoading) return;
    setPdfLoading(true);
    try {
      const base = (name || t('resumeDefaultName')).trim() || t('resumeDefaultName');
      const safe = base.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: snapshotForExport(),
          filename: `${safe}.pdf`,
          locale: locale === 'en' ? 'en' : 'zh',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === 'string' ? data.error : t('requestFailed', { status: res.status }),
        );
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
      message.success(t('exportPdfOk'));
    } catch (e) {
      message.error(e instanceof Error ? e.message : t('exportFail'));
    } finally {
      setPdfLoading(false);
    }
  };
  const exportImage = async () => {
    if (typeof window === 'undefined' || imageLoading || pdfLoading) return;
    setImageLoading(true);
    try {
      const base = (name || t('resumeDefaultName')).trim() || t('resumeDefaultName');
      const safe = base.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: snapshotForExport(),
          filename: `${safe}.jpg`,
          locale: locale === 'en' ? 'en' : 'zh',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === 'string' ? data.error : t('requestFailed', { status: res.status }),
        );
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.jpg`;
      a.click();
      URL.revokeObjectURL(href);
      message.success(t('exportImageOk'));
    } catch (e) {
      message.error(e instanceof Error ? e.message : t('exportFail'));
    } finally {
      setImageLoading(false);
    }
  };
  const exportJson = () => {
    try {
      const cfg = snapshotForExport();
      const base = (name || t('resumeDefaultName')).trim() || t('resumeDefaultName');
      const safe = base.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
      const json = JSON.stringify(cfg, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.json`;
      a.click();
      URL.revokeObjectURL(href);
      message.success(t('exportJsonOk'));
    } catch (e) {
      message.error(e instanceof Error ? e.message : t('exportFail'));
    }
  };
  return (
    <div className='flex h-full items-center justify-between gap-4 px-4 md:px-5'>
      <div className='flex min-h-0 min-w-0 flex-1 items-center gap-2'>
        <Link
          href='/'
          prefetch={false}
          className='flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg outline-none ring-[var(--text-strong)]/35 transition-opacity hover:opacity-90 focus-visible:ring-2'
          aria-label={t('backHome')}
        >
          <Image
            src='/logo.png'
            alt={t('logoAlt')}
            width={34}
            height={34}
            className='h-[32px] w-[32px] object-contain'
            draggable={false}
            priority
          />
        </Link>
        <div className='bg-gradient-primary-br h-[30px] w-[4px] shrink-0 rounded-full opacity-90' />
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={onBlur}
            onPressEnter={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
            onFocus={(e) => e.target.select()}
            maxLength={64}
            className='max-w-[280px] min-w-[120px]'
            styles={{
              input: {
                backgroundColor: 'var(--antd-input-bg)',
                color: 'var(--antd-input-fg)',
                border: '1px solid var(--antd-input-border)',
                borderRadius: 6,
                paddingInline: 8,
                height: 28,
              },
            }}
          />
        ) : (
          <>
            <span className='truncate text-[15px] font-medium leading-[22px] text-fg/96' title={name}>
              {name}
            </span>
            <Button
              type='text'
              size='small'
              icon={<EditOutlined />}
              aria-label={t('editNameAria')}
              className='cursor-pointer !text-fg/45 hover:!text-[var(--text-strong)] !p-0 !h-7 !w-7 !min-w-7 inline-flex shrink-0 items-center justify-center'
              onClick={startEdit}
            />
          </>
        )}
      </div>
      <div className='flex shrink-0 flex-wrap items-center justify-end gap-2'>
        <svg width={0} height={0} className='pointer-events-none absolute' aria-hidden>
          <defs>
            <linearGradient id={exportGradId} x1='0%' y1='0%' x2='100%' y2='0%'>
              <stop offset='0%' stopColor='var(--color-primary-gradient-start)' />
              <stop offset='100%' stopColor='var(--color-primary)' />
            </linearGradient>
          </defs>
        </svg>
        <button
          type='button'
          disabled={pdfLoading || imageLoading}
          onClick={() => void exportPdf()}
          className={`cursor-pointer ${exportChipOuter}`}
        >
          <span className={exportChipInner}>
            <span className={exportIconSlot} aria-hidden>
              {pdfLoading ? (
                <span className='inline-block size-4 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--color-primary-gradient-start)_35%,transparent)] border-t-[var(--color-primary)]' />
              ) : (
                <FilePdf theme='outline' size={20} fill={`url(#${exportGradId})`} />
              )}
            </span>
            <span className='bg-gradient-primary bg-clip-text text-center text-[12px] font-semibold leading-snug text-transparent whitespace-nowrap'>
              {t('exportPdf')}
            </span>
          </span>
        </button>
        <button
          type='button'
          disabled={pdfLoading || imageLoading}
          onClick={() => void exportImage()}
          className={`cursor-pointer ${exportChipOuter}`}
        >
          <span className={exportChipInner}>
            <span className={exportIconSlot} aria-hidden>
              {imageLoading ? (
                <span className='inline-block size-4 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--color-primary-gradient-start)_35%,transparent)] border-t-[var(--color-primary)]' />
              ) : (
                <DownPicture theme='outline' size={20} fill={`url(#${exportGradId})`} />
              )}
            </span>
            <span className='bg-gradient-primary bg-clip-text text-center text-[12px] font-semibold leading-snug text-transparent'>
              {t('exportImage')}
            </span>
          </span>
        </button>
        <button
          type='button'
          disabled={pdfLoading || imageLoading}
          onClick={() => exportJson()}
          className={`cursor-pointer ${exportChipOuter}`}
        >
          <span className={exportChipInner}>
            <span className={exportIconSlot} aria-hidden>
              <FileCode theme='outline' size={20} fill={`url(#${exportGradId})`} />
            </span>
            <span className='bg-gradient-primary bg-clip-text text-center text-[12px] font-semibold leading-snug text-transparent'>
              {t('exportJson')}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
export default memo(observer(Header));
