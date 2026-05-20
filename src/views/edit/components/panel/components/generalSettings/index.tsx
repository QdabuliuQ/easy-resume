'use client';
import { CheckCircleOutlined, FolderOpenOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { memo, useCallback, useEffect, useState } from 'react';
import { useAppMessage } from '@/hooks/useAppMessage';
import { useTranslations } from 'next-intl';
import { getBackupDirectorySnapshot, setBackupDirectoryState } from '@/lib/backupDirectoryStore';
import { flushResumeBackupImmediate } from '@/lib/resumeConfigBackup';
import {
  ensureReadWritePermission,
  pickDirectory,
  removeLegacyDirectoryHandleDatabase,
  supportsDirectoryPicker,
} from '@/lib/fileSystemAccessDirectory';
import { configStore } from '@/mobx';

const panelShellClass =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)] p-4 shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-md)]';

const rowCls = 'flex flex-col gap-2';
const labelCls = 'text-[11px] font-medium uppercase tracking-[0.14em] text-fg/52';

function GeneralSettings() {
  const message = useAppMessage();
  const tg = useTranslations('Edit.generalSettings');
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(
    () => getBackupDirectorySnapshot().handle
  );
  const [permissionOk, setPermissionOk] = useState(() => getBackupDirectorySnapshot().permissionOk);
  const [busyKey, setBusyKey] = useState<'pick' | null>(null);
  const busy = busyKey !== null;
  useEffect(() => {
    removeLegacyDirectoryHandleDatabase();
  }, []);
  const chooseFolder = useCallback(async () => {
    if (!supportsDirectoryPicker()) {
      message.error(tg('fsUnsupported'));
      return;
    }
    setBusyKey('pick');
    try {
      const h = await pickDirectory();
      if (!h) return;
      const ok = await ensureReadWritePermission(h);
      if (!ok) {
        message.warning(tg('permissionDeniedWarn'));
        setDirHandle(h);
        setPermissionOk(false);
        setBackupDirectoryState(h, false);
        return;
      }
      setDirHandle(h);
      setPermissionOk(true);
      setBackupDirectoryState(h, true);
      flushResumeBackupImmediate(configStore.getConfig);
      message.success(tg('connected', { name: h.name }));
    } catch (e) {
      message.error((e as Error)?.message ?? tg('pickFolderFail'));
    } finally {
      setBusyKey(null);
    }
  }, [message, tg]);
  const displayLabel = dirHandle?.name ?? tg('noFolder');
  const unsupported = !supportsDirectoryPicker();
  const hintSecondary = dirHandle ? tg('hintHasFolder') : tg('hintPickFolder');
  return (
    <div className={`${panelShellClass} space-y-3`}>
      {unsupported ? (
        <div className='flex items-start gap-2.5 rounded-xl border border-amber-500/28 bg-amber-500/[0.08] px-3 py-2.5 text-[12px] leading-snug text-fg/85'>
          <WarningOutlined className='mt-0.5 shrink-0 text-amber-500/90' />
          <span>{tg('unsupportedBanner')}</span>
        </div>
      ) : null}
      <div className={rowCls}>
        <div className='flex items-center justify-between gap-2'>
          <span className={labelCls}>{tg('folderLabel')}</span>
          {dirHandle ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                permissionOk
                  ? 'bg-emerald-500/14 text-[var(--panel-tone-emerald)]'
                  : 'bg-amber-500/14 text-[var(--panel-tone-amber)]'
              }`}
            >
              {permissionOk ? (
                <CheckCircleOutlined className='text-[12px]' />
              ) : (
                <WarningOutlined className='text-[12px]' />
              )}
              {permissionOk ? tg('autoBackupOn') : tg('permissionInsufficient')}
            </span>
          ) : null}
        </div>
        <button
          type='button'
          disabled={unsupported || busy}
          onClick={chooseFolder}
          className='flex w-full min-h-[46px] cursor-pointer items-center gap-3 rounded-xl border border-fg/[0.1] bg-[rgb(var(--surface-fg-rgb)/0.035)] px-3 py-2.5 text-left shadow-[inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.05)] outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-fg/[0.16] hover:bg-[rgb(var(--surface-fg-rgb)/0.055)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-bg)] disabled:pointer-events-none disabled:opacity-45'
        >
          <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-fg/[0.08] bg-[rgb(var(--surface-fg-rgb)/0.06)] text-[var(--color-primary)]'>
            <FolderOpenOutlined className='text-[17px]' />
          </span>
          <span className='min-w-0 flex-1'>
            <span className='block truncate font-mono text-[13px] font-medium text-fg/88' title={displayLabel}>
              {displayLabel}
            </span>
            <span className='mt-0.5 block text-[11px] text-fg/48'>{hintSecondary}</span>
          </span>
        </button>
      </div>
      <div className='flex items-start gap-2 rounded-lg border border-fg/[0.06] bg-[rgb(var(--surface-fg-rgb)/0.03)] px-3 py-2 text-[11px] leading-relaxed text-fg/52'>
        <InfoCircleOutlined className='mt-0.5 shrink-0 text-fg/40' />
        <span>{tg('footerHint')}</span>
      </div>
    </div>
  );
}

export default memo(GeneralSettings);
