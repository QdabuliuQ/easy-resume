'use client';
import { useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import MenuGradientDefs from './menuGradientDefs';
import MenuItemIcon from './menuItemIcon';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { useAppMessage } from '@/hooks/useAppMessage';
import { configStore } from '@/mobx';
import { flushResumeBackupImmediate } from '@/lib/resumeConfigBackup';
import {
  getResumeImportValidationError,
  normalizeResumeImportPayload,
} from '@/lib/validateResumeImportJson';
/** 侧栏内容区宽 108 - padding 40 */
const MENU_TILE_SIZE_PX = 68;
const MENU_TILE_SHADOW_PAD_PX = 6;
const MENU_TILE_TOP_LINE_INSET_PX = MENU_TILE_SHADOW_PAD_PX + 4;
const MENU_TILE_TRANSITION =
  'transition-[transform,box-shadow,background-color,border-color] duration-[220ms] ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100';
const MENU_TILE_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-panel)]';
const MENU_TILE_RADIUS = 'rounded-t-none rounded-b-[18px]';
const MENU_TILE_INNER_RADIUS = 'rounded-t-none rounded-b-[17px]';
const menuTileClass = `relative isolate flex cursor-pointer select-none flex-col items-center justify-center gap-0.5 overflow-visible ${MENU_TILE_RADIUS} py-2.5 text-[11px] ${MENU_TILE_TRANSITION} ${MENU_TILE_FOCUS}`;
const TILE_IMPORT = [
  '[background:color-mix(in_srgb,var(--color-primary)_12%,var(--editor-shell-panel-strong))]',
  'border border-[color-mix(in_srgb,var(--color-primary)_38%,transparent)]',
  'shadow-[0_2px_10px_color-mix(in_srgb,var(--color-primary)_18%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-primary)_28%,transparent)]',
  'hover:scale-[1.03]',
  'hover:[background:color-mix(in_srgb,var(--color-primary)_16%,var(--editor-shell-panel-strong))]',
  'hover:shadow-[0_6px_18px_color-mix(in_srgb,var(--color-primary)_24%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-primary)_32%,transparent)]',
  'active:scale-[0.99]',
].join(' ');
const TILE_SELECTED = [
  'z-[1]',
  '[background:color-mix(in_srgb,var(--color-primary)_9%,var(--editor-shell-panel-strong))]',
  'border border-transparent',
  'shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-primary)_32%,transparent),0_4px_16px_color-mix(in_srgb,var(--color-primary)_18%,transparent),inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.14)]',
  'hover:scale-[1.03]',
  'hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-primary)_38%,transparent),0_6px_20px_color-mix(in_srgb,var(--color-primary)_24%,transparent),inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.16)]',
  'active:scale-[0.99]',
].join(' ');
const TILE_DEFAULT = [
  '[background:linear-gradient(180deg,rgb(var(--surface-fg-rgb)/0.08)_0%,rgb(var(--surface-fg-rgb)/0.04)_100%)]',
  'border border-[rgb(var(--surface-fg-rgb)/0.1)]',
  'shadow-[0_1px_2px_rgb(var(--surface-bg-rgb)/0.12),0_3px_10px_rgb(var(--surface-bg-rgb)/0.1),inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.1)]',
  'hover:scale-[1.02]',
  'hover:[background:linear-gradient(180deg,rgb(var(--surface-fg-rgb)/0.12)_0%,rgb(var(--surface-fg-rgb)/0.07)_100%)]',
  'hover:border-[rgb(var(--surface-fg-rgb)/0.16)]',
  'hover:shadow-[0_2px_4px_rgb(var(--surface-bg-rgb)/0.1),0_6px_16px_rgb(var(--surface-bg-rgb)/0.16),inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.14)]',
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
        { label: t('pageSettings'), key: 'page-settings' as const },
        { label: t('aiScore'), key: 'ai-score' as const },
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
        className='relative flex shrink-0 items-center justify-center overflow-visible'
        style={{
          width: MENU_TILE_SIZE_PX + MENU_TILE_SHADOW_PAD_PX * 2,
          height: MENU_TILE_SIZE_PX + MENU_TILE_SHADOW_PAD_PX * 2,
        }}
      >
        {accent ? (
          <span
            aria-hidden
            className='bg-gradient-primary pointer-events-none absolute z-[3] h-[2px] opacity-90'
            style={{
              top: MENU_TILE_SHADOW_PAD_PX,
              left: MENU_TILE_TOP_LINE_INSET_PX,
              right: MENU_TILE_TOP_LINE_INSET_PX,
            }}
          />
        ) : null}
        <div
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
          {accent ? (
            <span
              aria-hidden
              className={`pointer-events-none absolute inset-0 ${MENU_TILE_RADIUS} bg-gradient-primary p-px`}
            >
              <span className={`block h-full w-full ${MENU_TILE_INNER_RADIUS} bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--editor-shell-panel-strong))] shadow-[inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.1)]`} />
            </span>
          ) : null}
          <MenuItemIcon menuKey={item.key} selected={accent} />
          <span
            className={
              accent
                ? 'relative z-[1] max-w-[62px] px-0.5 text-center text-[10px] font-medium leading-[1.2] tracking-[0.01em] bg-gradient-primary bg-clip-text text-transparent'
                : 'relative z-[1] max-w-[62px] px-0.5 text-center text-[10px] leading-[1.2] tracking-[0.01em] text-[var(--menu-icon-muted)]'
            }
          >
            {item.label}
          </span>
        </div>
      </div>
    );
  };
  return (
    <>
      {contextHolder}
      <div className='relative flex h-full min-h-0 w-[108px] shrink-0 flex-col items-center bg-transparent'>
      <input
        ref={fileRef}
        type='file'
        accept='.json,application/json'
        className='sr-only'
        aria-hidden
        onChange={onImportFile}
      />
      <MenuGradientDefs />
      <div className='flex h-full min-h-0 w-full flex-1 flex-col'>
        <div className='flex min-h-0 flex-1 flex-col items-center overflow-y-auto overscroll-contain py-3 [scrollbar-width:thin]'>
          <div className='flex w-full flex-col items-center gap-1.5'>
            {panelMenuItems.map((item) => renderMenuItem(item))}
          </div>
        </div>
        <div className='flex shrink-0 flex-col items-center gap-1.5 pb-3 pt-2'>
          {renderMenuItem(importMenu)}
        </div>
      </div>
    </div>
    </>
  );
}
