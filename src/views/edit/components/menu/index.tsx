'use client';
import { uiHints } from '@/lib/uiHintStorage';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { observer } from 'mobx-react';
import MenuItemIcon from './menuItemIcon';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { useAppMessage } from '@/hooks/useAppMessage';
import { configStore, editHistoryStore, resumeImportStore } from '@/mobx';
import { flushResumeBackupImmediate } from '@/lib/resumeConfigBackup';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';
import { useResumeImport } from '@/views/edit/hooks/useResumeImport';
import {
  getResumeImportValidationError,
  normalizeResumeImportPayload,
} from '@/lib/validateResumeImportJson';

const MENU_TILE_SIZE_PX = 68;
const MENU_TILE_TRANSITION =
  'transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100';
const MENU_TILE_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-panel)]';
const menuTileClass = `relative isolate flex cursor-pointer select-none flex-col items-center justify-center gap-1 overflow-hidden rounded-xl py-2 text-[10px] leading-[1.2] ${MENU_TILE_TRANSITION} ${MENU_TILE_FOCUS}`;
const TILE_DEFAULT = [
  'border border-transparent',
  'bg-[rgb(var(--surface-fg-rgb)/0.055)]',
  'text-[var(--menu-icon-muted)]',
  'hover:bg-[rgb(var(--surface-fg-rgb)/0.085)]',
  'hover:text-[rgb(var(--surface-fg-rgb)/0.58)]',
  'active:scale-[0.98]',
].join(' ');
const TILE_SELECTED = [
  'z-[1]',
  'border border-[color:var(--color-primary)]',
  'bg-[color-mix(in_srgb,var(--color-primary)_11%,var(--editor-shell-panel-strong))]',
  'text-[color:var(--color-primary)]',
  'shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_14%,transparent),0_6px_18px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]',
  'hover:bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--editor-shell-panel-strong))]',
  'active:scale-[0.98]',
].join(' ');
const TILE_IMPORT = [
  'border border-[color-mix(in_srgb,var(--color-primary)_32%,transparent)]',
  'bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--editor-shell-panel-strong))]',
  'text-[color:var(--color-primary)]',
  'hover:bg-[color-mix(in_srgb,var(--color-primary)_16%,var(--editor-shell-panel-strong))]',
  'hover:border-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]',
  'active:scale-[0.98]',
].join(' ');

type MenuProps = {
  activeKey: string;
  onActiveKeyChange: (key: string) => void;
};

export default observer(function Menu({ activeKey, onActiveKeyChange }: MenuProps) {
  const message = useAppMessage();
  const t = useTranslations('Edit.menu');
  const { status, data: session } = useSession();
  const signedIn = status === 'authenticated' && Boolean(session?.user);
  const importResumeMenu = useMemo(() => ({ label: t('importResume'), key: 'import-resume' as const }), [t]);
  const importMenu = useMemo(() => ({ label: t('importTemplate'), key: 'import-template' as const }), [t]);
  const panelMenuItems = useMemo(() => {
    const items: { label: string; key: string }[] = [
      { label: t('resumeTemplate'), key: 'resume-template' },
      { label: t('resume'), key: 'resume' },
      { label: t('aiScore'), key: 'ai-score' },
      { label: t('aiModify'), key: 'ai-modify' },
      { label: t('pageSettings'), key: 'page-settings' },
      { label: t('generalSettings'), key: 'general-settings' },
    ];
    if (signedIn) {
      items.splice(1, 0, { label: t('myResumes'), key: 'my-resumes' });
    }
    return items;
  }, [t, signedIn]);
  useEffect(() => {
    if (!signedIn && activeKey === 'my-resumes') {
      onActiveKeyChange('resume');
    }
  }, [signedIn, activeKey, onActiveKeyChange]);
  const { confirm, contextHolder } = useResponsiveConfirm();
  const {
    contextHolder: resumeImportContextHolder,
    fileRef: resumeImportFileRef,
    onFileChange: onResumeImportFileChange,
    confirmThenPick: confirmThenPickResumeImport,
    loading: resumeImportLoading,
  } = useResumeImport();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hintAiModify, setHintAiModify] = useState(false);
  const [hintAiScore, setHintAiScore] = useState(false);
  useEffect(() => {
    setHintAiModify(!uiHints.aiModifyMenu.isDismissed());
    setHintAiScore(!uiHints.aiScoreMenu.isDismissed());
  }, []);
  const dismissMenuHint = (key: string) => {
    if (key === 'ai-modify') {
      uiHints.aiModifyMenu.dismiss();
      setHintAiModify(false);
    } else if (key === 'ai-score') {
      uiHints.aiScoreMenu.dismiss();
      setHintAiScore(false);
    }
  };
  const pickImportFile = () => fileRef.current?.click();
  const confirmThenPickImport = () => {
    confirm({
      title: t('confirmImportTitle'),
      content: t('confirmImportContent'),
      okText: t('okContinue'),
      cancelText: t('cancel'),
      onOk: () => {
        pickImportFile();
      },
    });
  };
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await f.text());
    } catch {
      message.error(t('templateError'));
      return;
    }
    const normalized = normalizeResumeImportPayload(parsed);
    const err = getResumeImportValidationError(normalized);
    if (err) {
      message.error(t('templateError'));
      return;
    }
    editHistoryStore.clear();
    configStore.setConfig(normalized, { source: 'reset' });
    resetAiModifyChatSession();
    message.success(t('importOk'));
    flushResumeBackupImmediate(configStore.getConfig);
  };
  const renderMenuItem = (item: { label: string; key: string }) => {
    const isActionImportResume = item.key === 'import-resume';
    const isActionImport = item.key === 'import-template';
    const isAction = isActionImport || isActionImportResume;
    const selected = !isAction && activeKey === item.key;
    const accent = selected || isAction;
    const tileCls = isAction ? TILE_IMPORT : selected ? TILE_SELECTED : TILE_DEFAULT;
    const showHint =
      !isAction &&
      !selected &&
      ((item.key === 'ai-modify' && hintAiModify) || (item.key === 'ai-score' && hintAiScore));
    const hintCls = showHint ? ' ui-hint-shimmer' : '';
    const label =
      isActionImportResume && resumeImportLoading && resumeImportStore.statusText
        ? resumeImportStore.statusText
        : item.label;
    return (
      <div
        key={item.key}
        data-edit-tour={
          item.key === 'resume-template' || item.key === 'ai-score' || item.key === 'ai-modify'
            ? `menu-${item.key}`
            : undefined
        }
        role='button'
        tabIndex={0}
        aria-current={selected ? 'page' : undefined}
        aria-label={label}
        aria-busy={isActionImportResume && resumeImportLoading}
        onClick={() => {
          if (isActionImportResume) confirmThenPickResumeImport();
          else if (isActionImport) confirmThenPickImport();
          else {
            dismissMenuHint(item.key);
            onActiveKeyChange(item.key);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isActionImportResume) confirmThenPickResumeImport();
            else if (isActionImport) confirmThenPickImport();
            else {
              dismissMenuHint(item.key);
              onActiveKeyChange(item.key);
            }
          }
        }}
        className={`${menuTileClass} ${tileCls}${hintCls}${isActionImportResume && resumeImportLoading ? ' pointer-events-none opacity-60' : ''}`}
        style={{ width: MENU_TILE_SIZE_PX, height: MENU_TILE_SIZE_PX }}
      >
        {isActionImportResume && resumeImportLoading ? (
          <span
            className='relative z-[1] mb-0.5 inline-block size-5 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--color-primary-gradient-start)_35%,transparent)] border-t-[var(--color-primary)]'
            aria-hidden
          />
        ) : (
          <MenuItemIcon menuKey={item.key} selected={accent} />
        )}
        <span className='relative z-[1] max-w-[62px] px-0.5 text-center font-medium'>
          {label}
        </span>
      </div>
    );
  };
  return (
    <>
      {contextHolder}
      {resumeImportContextHolder}
      <div className='relative flex h-full min-h-0 w-[96px] shrink-0 flex-col px-2.5 py-3'>
        <input
          ref={resumeImportFileRef}
          type='file'
          accept='.pdf,application/pdf,image/jpeg,image/png'
          className='sr-only'
          aria-hidden
          onChange={onResumeImportFileChange}
        />
        <input
          ref={fileRef}
          type='file'
          accept='.json,application/json'
          className='sr-only'
          aria-hidden
          onChange={onImportFile}
        />
        <div className='pointer-events-none absolute inset-x-2.5 inset-y-3 opacity-[0.35] [background-image:radial-gradient(circle,rgb(var(--surface-fg-rgb)/0.12)_1px,transparent_1px)] [background-size:10px_10px]' />
        <div className='relative flex min-h-0 flex-1 flex-col'>
          <div className='flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain [scrollbar-width:thin]'>
            <div className='flex w-full flex-col items-center gap-2'>
              {panelMenuItems.map((item) => renderMenuItem(item))}
            </div>
          </div>
          <div className='relative mt-3 flex shrink-0 flex-col items-center gap-2 pt-1'>
            {renderMenuItem(importResumeMenu)}
            {renderMenuItem(importMenu)}
          </div>
        </div>
      </div>
    </>
  );
});
