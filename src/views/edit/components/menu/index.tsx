'use client';
import {
  AppstoreOutlined,
  ProfileOutlined,
  SettingOutlined,
  SlidersOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { Magic } from '@icon-park/react';
import { useTranslations } from 'next-intl';
import { useMemo, useRef } from 'react';
import { configStore } from '@/mobx';
import { flushResumeBackupImmediate } from '@/lib/resumeConfigBackup';
import {
  getResumeImportValidationError,
  normalizeResumeImportPayload,
} from '@/lib/validateResumeImportJson';
const GRADIENT_ID = 'resume-menu-item-grad';
function MenuItemIcon({ menuKey, selected }: { menuKey: string; selected: boolean }) {
  const antIconCls = selected
    ? 'relative z-[1] text-[20px] mb-[3px] transition-[fill] duration-200 [&_svg]:!fill-[url(#resume-menu-item-grad)]'
    : 'relative z-[1] text-[20px] mb-[3px] transition-[fill] duration-200 [&_svg]:!fill-[var(--menu-icon-muted)]';
  if (menuKey === 'import-template') return <UploadOutlined className={antIconCls} />;
  if (menuKey === 'resume') return <ProfileOutlined className={antIconCls} />;
  if (menuKey === 'resume-template') return <AppstoreOutlined className={antIconCls} />;
  if (menuKey === 'general-settings') return <SettingOutlined className={antIconCls} />;
  if (menuKey === 'page-settings') return <SlidersOutlined className={antIconCls} />;
  return (
    <Magic
      theme='outline'
      size='20'
      fill={selected ? `url(#${GRADIENT_ID})` : 'var(--menu-icon-muted)'}
      className='relative z-[1] transition-[fill] duration-200 mb-[3px]'
    />
  );
}
type MenuProps = {
  activeKey: string;
  onActiveKeyChange: (key: string) => void;
};
export default function Menu({ activeKey, onActiveKeyChange }: MenuProps) {
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
    const selected = item.key !== 'import-template' && activeKey === item.key;
    const isImport = item.key === 'import-template';
    const accent = selected || isImport;
    const tileCls = isImport
      ? [
          'scale-[1.03]',
          '[background:color-mix(in_srgb,var(--color-primary)_12%,var(--editor-shell-panel-strong))]',
          'border border-[color-mix(in_srgb,var(--color-primary)_38%,transparent)]',
          'shadow-[0_4px_18px_color-mix(in_srgb,var(--color-primary)_22%,transparent),inset_0_1px_0_color-mix(in_srgb,var(--color-primary)_28%,transparent)]',
          'hover:scale-[1.07]',
          'hover:[background:color-mix(in_srgb,var(--color-primary)_16%,var(--editor-shell-panel-strong))]',
          'hover:shadow-[0_8px_26px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]',
          'active:scale-[1.01]',
        ].join(' ')
      : selected
        ? [
            'z-[1] scale-[1.07]',
            '[background:color-mix(in_srgb,var(--color-primary)_9%,var(--editor-shell-panel-strong))]',
            'border border-transparent',
            'shadow-[0_6px_22px_color-mix(in_srgb,var(--color-primary)_24%,transparent),0_0_0_1.5px_color-mix(in_srgb,var(--color-primary)_32%,transparent),inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.14)]',
          ].join(' ')
        : [
            '[background:linear-gradient(180deg,rgb(var(--surface-fg-rgb)/0.08)_0%,rgb(var(--surface-fg-rgb)/0.04)_100%)]',
            'border border-[rgb(var(--surface-fg-rgb)/0.1)]',
            'shadow-[0_2px_8px_rgb(var(--surface-bg-rgb)/0.14),inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.1)]',
            'hover:scale-[1.04]',
            'hover:[background:linear-gradient(180deg,rgb(var(--surface-fg-rgb)/0.12)_0%,rgb(var(--surface-fg-rgb)/0.07)_100%)]',
            'hover:border-[rgb(var(--surface-fg-rgb)/0.16)]',
            'hover:shadow-[0_4px_16px_rgb(var(--surface-bg-rgb)/0.22),inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.14)]',
            'active:scale-[0.98]',
          ].join(' ');
    return (
      <div
        key={item.key}
        role='button'
        tabIndex={0}
        onClick={() => (isImport ? confirmThenPickImport() : onActiveKeyChange(item.key))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            isImport ? confirmThenPickImport() : onActiveKeyChange(item.key);
          }
        }}
        className={`aspect-square relative flex w-full cursor-pointer select-none flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[18px] py-2.5 text-[11px] transition-all duration-200 ease-out ${tileCls}`}
      >
        {accent ? (
          <span
            aria-hidden
            className='pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-primary p-px'
          >
            <span className='block h-full w-full rounded-[17px] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--editor-shell-panel-strong))]' />
          </span>
        ) : null}
        {accent ? (
          <span
            aria-hidden
            className='bg-gradient-primary absolute inset-x-1 top-0 z-[2] h-[2px] rounded-full opacity-70 blur-[2px]'
          />
        ) : null}
        <MenuItemIcon menuKey={item.key} selected={accent} />
        <span
          className={
            accent
              ? 'bg-gradient-primary relative z-[1] bg-clip-text text-[10px] font-medium text-transparent transition-colors duration-200'
              : 'relative z-[1] text-[10px] text-[var(--menu-icon-muted)] transition-colors duration-200'
          }
        >
          {item.label}
        </span>
      </div>
    );
  };
  return (
    <>
      {contextHolder}
      <div className='relative flex h-full min-h-0 w-[108px] shrink-0 flex-col items-stretch justify-between bg-transparent p-[20px]'>
      <input
        ref={fileRef}
        type='file'
        accept='.json,application/json'
        className='sr-only'
        aria-hidden
        onChange={onImportFile}
      />
      <svg width={0} height={0} className='absolute' aria-hidden>
        <defs>
          <linearGradient id={GRADIENT_ID} x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='var(--color-primary-gradient-start)' />
            <stop offset='100%' stopColor='var(--color-primary)' />
          </linearGradient>
        </defs>
      </svg>
      <div className='flex w-full min-w-0 min-h-0 flex-col gap-[13px]'>
        {panelMenuItems.map((item) => renderMenuItem(item))}
      </div>
      <div className='flex w-full min-w-0 shrink-0 flex-col gap-[10px]'>{renderMenuItem(importMenu)}</div>
    </div>
    </>
  );
}
