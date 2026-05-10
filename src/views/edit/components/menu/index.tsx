'use client';
import {
  AppstoreOutlined,
  ProfileOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { message, Modal } from 'antd';
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
    ? 'relative z-[1] text-[28px] transition-[fill] duration-200 [&_svg]:!fill-[url(#resume-menu-item-grad)]'
    : 'relative z-[1] text-[28px] transition-[fill] duration-200 [&_svg]:!fill-[var(--menu-icon-muted)]';
  if (menuKey === 'import-template') return <UploadOutlined className={antIconCls} />;
  if (menuKey === 'resume') return <ProfileOutlined className={antIconCls} />;
  if (menuKey === 'resume-template') return <AppstoreOutlined className={antIconCls} />;
  if (menuKey === 'general-settings') return <SettingOutlined className={antIconCls} />;
  return (
    <Magic
      theme='outline'
      size='28'
      fill={selected ? `url(#${GRADIENT_ID})` : 'var(--menu-icon-muted)'}
      className='relative z-[1] transition-[fill] duration-200'
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
        { label: t('aiScore'), key: 'ai-score' as const },
        { label: t('generalSettings'), key: 'general-settings' as const },
      ] as const,
    [t],
  );
  const [modal, contextHolder] = Modal.useModal();
  const fileRef = useRef<HTMLInputElement>(null);
  const pickImportFile = () => fileRef.current?.click();
  const confirmThenPickImport = () => {
    modal.confirm({
      title: t('confirmImportTitle'),
      content: t('confirmImportContent'),
      okText: t('okContinue'),
      cancelText: t('cancel'),
      centered: true,
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
      ? 'scale-[1.03] border-transparent bg-[var(--color-primary)]/12 shadow-[0_10px_26px_color-mix(in_srgb,var(--color-primary)_22%,transparent)] hover:bg-[var(--color-primary)]/18 hover:shadow-[0_14px_34px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]'
      : selected
        ? 'z-[1] scale-110 border-transparent bg-fg/[0.08] shadow-[0_12px_30px_rgba(0,0,0,0.24)]'
        : 'border border-fg/[0.08] bg-[var(--panel-inset-bg)] shadow-[inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.07)] hover:border-fg/[0.12] hover:bg-[var(--panel-inset-bg-strong)]';
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
        className={`editor-shell-inset relative flex w-full cursor-pointer select-none flex-col items-center justify-center gap-1 overflow-hidden rounded-[18px] py-3 text-[13px] transition-all duration-200 ${tileCls}`}
      >
        {accent ? (
          <span
            aria-hidden
            className='pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-primary p-px'
          >
            <span className='block h-full w-full rounded-[17px] bg-[var(--menu-selected-inner)]' />
          </span>
        ) : null}
        {accent ? (
          <span
            aria-hidden
            className='bg-gradient-primary absolute inset-x-2 top-0 z-[2] h-px opacity-90'
          />
        ) : null}
        <MenuItemIcon menuKey={item.key} selected={accent} />
        <span
          className={
            accent
              ? 'bg-gradient-primary relative z-[1] bg-clip-text text-[12px] font-medium text-transparent transition-colors duration-200'
              : 'relative z-[1] text-[12px] text-[var(--menu-icon-muted)] transition-colors duration-200'
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
      <div className='relative flex h-full min-h-0 w-[108px] shrink-0 flex-col justify-between bg-transparent px-[10px] py-[10px]'>
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
      <div className='flex min-h-0 flex-col gap-[10px]'>{panelMenuItems.map((item) => renderMenuItem(item))}</div>
      <div className='flex shrink-0 flex-col gap-[10px]'>{renderMenuItem(importMenu)}</div>
    </div>
    </>
  );
}
