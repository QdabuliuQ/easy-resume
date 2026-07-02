'use client';
import { useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import MenuItemIcon from './menuItemIcon';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { useAppMessage } from '@/hooks/useAppMessage';
import { configStore } from '@/mobx';
import { flushResumeBackupImmediate } from '@/lib/resumeConfigBackup';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';
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

export default function Menu({ activeKey, onActiveKeyChange }: MenuProps) {
  const message = useAppMessage();
  const t = useTranslations('Edit.menu');
  const importMenu = useMemo(() => ({ label: t('importTemplate'), key: 'import-template' as const }), [t]);
  const panelMenuItems = useMemo(
    () =>
      [
        { label: t('resumeTemplate'), key: 'resume-template' as const },
        { label: t('resume'), key: 'resume' as const },
        { label: t('aiScore'), key: 'ai-score' as const },
        { label: t('aiModify'), key: 'ai-modify' as const },
        { label: t('pageSettings'), key: 'page-settings' as const },
        { label: t('generalSettings'), key: 'general-settings' as const },
      ] as const,
    [t],
  );
  const { confirm, contextHolder } = useResponsiveConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
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
    configStore.setConfig(normalized);
    resetAiModifyChatSession();
    message.success(t('importOk'));
    flushResumeBackupImmediate(configStore.getConfig);
  };
  const renderMenuItem = (item: { label: string; key: string }) => {
    const isActionImport = item.key === 'import-template';
    const selected = !isActionImport && activeKey === item.key;
    const accent = selected || isActionImport;
    const tileCls = isActionImport ? TILE_IMPORT : selected ? TILE_SELECTED : TILE_DEFAULT;
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
        aria-label={item.label}
        onClick={() => {
          if (item.key === 'import-template') confirmThenPickImport();
          else onActiveKeyChange(item.key);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (item.key === 'import-template') confirmThenPickImport();
            else onActiveKeyChange(item.key);
          }
        }}
        className={`${menuTileClass} ${tileCls}`}
        style={{ width: MENU_TILE_SIZE_PX, height: MENU_TILE_SIZE_PX }}
      >
        <MenuItemIcon menuKey={item.key} selected={accent} />
        <span className='relative z-[1] max-w-[62px] px-0.5 text-center font-medium'>
          {item.label}
        </span>
      </div>
    );
  };
  return (
    <>
      {contextHolder}
      <div className='relative flex h-full min-h-0 w-[96px] shrink-0 flex-col px-2.5 py-3'>
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
          <div className='relative mt-3 flex shrink-0 flex-col items-center pt-1'>
            {renderMenuItem(importMenu)}
          </div>
        </div>
      </div>
    </>
  );
}
