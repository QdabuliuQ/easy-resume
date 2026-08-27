'use client';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { memo, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useSession } from 'next-auth/react';
import { Button, Input, Tooltip } from 'antd';
import {
  CheckCircleFilled,
  EditOutlined,
  LoadingOutlined,
  RedoOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Copy, Save, Share } from '@icon-park/react';
import GithubAuthButton from '@/components/auth/GithubAuthButton';
import LoginDropdownButton from '@/components/auth/LoginDropdownButton';
import { useAppMessage } from '@/hooks/useAppMessage';
import { cloudResumeStore, configStore } from '@/mobx';
import defaultResume from '@/json/resume.defaults';
import { logo } from '@/lib/brandAssets';
import { useExportBusy } from '@/views/edit/hooks/useResumeExport';
import { useEditHistory } from '@/views/edit/hooks/useEditHistory';
import ShareResumeModal from '@/views/edit/components/header/ShareResumeModal';
import { actionBtnCls, actionIconSpin, ICON_PRIMARY, ICON_MUTED } from './headerActionStyles';

let headerExportMenuPromise: Promise<typeof import('./HeaderExportMenu')> | null = null;

function prefetchHeaderExportMenu() {
  if (!headerExportMenuPromise) {
    headerExportMenuPromise = import('./HeaderExportMenu');
  }
  return headerExportMenuPromise;
}

const HeaderExportMenu = dynamic(() => prefetchHeaderExportMenu().then((m) => m.default), {
  ssr: false,
});

function HeaderExportMenuPlaceholder() {
  const t = useTranslations('Edit.header');
  return (
    <button type='button' aria-label={t('exportLabel')} className={actionBtnCls}>
      <span className='inline-block size-[18px] rounded-sm bg-[color-mix(in_srgb,var(--color-primary)_25%,transparent)]' aria-hidden />
      {t('exportLabel')}
    </button>
  );
}
/** 次要操作（创建副本等）：弱化样式，避免被当成「保存」 */
const quietBtnCls = [
  'inline-flex min-h-9 cursor-pointer select-none items-center justify-center gap-1 rounded-xl px-2.5 py-2',
  'border border-fg/12 bg-transparent',
  'text-[12px] font-medium leading-snug text-fg/55 whitespace-nowrap',
  'transition-[transform,background-color,border-color,color] duration-200 ease-out',
  'hover:border-fg/20 hover:bg-fg/[0.06] hover:text-fg/75',
  'active:scale-[0.98]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/25 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-panel)]',
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
  'motion-reduce:transition-none motion-reduce:active:scale-100',
].join(' ');

const historyBtnCls =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-fg/[0.1] bg-surface/[0.04] text-fg/55 transition-colors enabled:cursor-pointer enabled:hover:border-fg/[0.16] enabled:hover:bg-surface/[0.08] enabled:hover:text-fg/88 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-fg/[0.1] disabled:hover:bg-surface/[0.04] disabled:hover:text-fg/55';

function Header() {
  const t = useTranslations('Edit.header');
  const ta = useTranslations('Auth');
  const message = useAppMessage();
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const authLoading = status === 'loading';
  const { canUndo, canRedo, undo, redo } = useEditHistory();
  const exporting = useExportBusy();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [exportMenuReady, setExportMenuReady] = useState(false);
  const ignoreNextBlur = useRef(false);
  const name = configStore.getConfig?.name ?? defaultResume.name;
  const actionsDisabled = exporting;
  const showSave = cloudResumeStore.showSaveButton;
  const showSaveAs = cloudResumeStore.showSaveAsButton;
  const saving = cloudResumeStore.saving;
  const resumeId = cloudResumeStore.resumeId;
  const canShare = signedIn && Boolean(resumeId);
  const commit = () => {
    const trimmed = draft.trim();
    const base =
      configStore.getConfig ?? JSON.parse(JSON.stringify(defaultResume));
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
  const onSave = async () => {
    if (status !== 'authenticated') {
      message.warning(t('saveNeedLogin'));
      return;
    }
    const result = await cloudResumeStore.save();
    if (result.ok) message.success(t('saveOk'));
    else message.error(result.error || t('saveFail'));
  };
  const onSaveAs = async () => {
    if (status !== 'authenticated') {
      message.warning(t('saveNeedLogin'));
      return;
    }
    const base = (configStore.getConfig?.name ?? name).trim() || t('resumeDefaultName');
    const result = await cloudResumeStore.saveAs({ name: t('saveAsName', { name: base }) });
    if (result.ok) message.success(t('saveAsOk'));
    else message.error(result.error || t('saveFail'));
  };
  const onShareClick = () => {
    if (!signedIn) {
      message.warning(t('shareNeedLogin'));
      return;
    }
    if (!resumeId) {
      message.warning(t('shareNeedSave'));
      return;
    }
    setShareOpen(true);
  };
  return (
    <div className='relative flex h-full items-center justify-between gap-4 px-4 md:px-5'>
      <div className='flex min-h-0 min-w-0 flex-1 items-center gap-2'>
        <Link
          href='/'
          prefetch={false}
          className='flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg outline-none ring-[var(--text-strong)]/35 transition-opacity hover:opacity-90 focus-visible:ring-2'
          aria-label={t('backHome')}
        >
          <Image
            src={logo}
            alt={t('logoAlt')}
            width={40}
            height={40}
            className='h-[40px] w-[40px] object-contain'
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
            <span
              className='truncate text-[15px] font-medium leading-[22px] text-fg/96'
              title={name}
            >
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
      <div className='pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5'>
        <button
          type='button'
          disabled={!canUndo || actionsDisabled}
          onClick={undo}
          aria-label={t('undoAria')}
          title={t('undo')}
          className={`pointer-events-auto ${historyBtnCls}`}
        >
          <UndoOutlined className='text-[15px]' />
        </button>
        <button
          type='button'
          disabled={!canRedo || actionsDisabled}
          onClick={redo}
          aria-label={t('redoAria')}
          title={t('redo')}
          className={`pointer-events-auto ${historyBtnCls}`}
        >
          <RedoOutlined className='text-[15px]' />
        </button>
      </div>
      <div
        className='flex shrink-0 flex-wrap items-center justify-end gap-2'
        data-edit-tour='header-export'
      >
        {!showSave ? (
          <Tooltip title={t('saveAsHint')}>
            <span
              className='hidden items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_16%,transparent)] px-2.5 py-1.5 text-[12px] font-semibold text-[color:var(--color-primary)] sm:inline-flex'
              aria-live='polite'
            >
              {saving ? (
                <LoadingOutlined className='text-[13px]' />
              ) : (
                <CheckCircleFilled className='text-[14px]' />
              )}
              {saving ? t('autosaving') : t('autosaved')}
            </span>
          </Tooltip>
        ) : null}
        {authLoading ? (
          <span
            className='inline-flex h-9 w-9 items-center justify-center rounded-xl border border-fg/14 bg-fg/[0.05] text-fg/55'
            aria-label={ta('loading')}
          >
            <LoadingOutlined className='text-[14px]' />
          </span>
        ) : signedIn ? (
          <GithubAuthButton variant='compact' />
        ) : (
          <LoginDropdownButton />
        )}
        {showSave ? (
          <Tooltip title={signedIn ? undefined : t('saveNeedLogin')}>
            <span className={`inline-flex ${signedIn ? '' : 'cursor-not-allowed'}`}>
              <button
                type='button'
                disabled={actionsDisabled || saving || !signedIn}
                onClick={() => void onSave()}
                className={`${signedIn ? '' : 'pointer-events-none'} ${actionBtnCls}`}
              >
                {saving ? (
                  <span className={actionIconSpin} aria-hidden />
                ) : (
                  <Save theme='outline' size={18} fill={ICON_PRIMARY} />
                )}
                {saving ? t('saving') : t('save')}
              </button>
            </span>
          </Tooltip>
        ) : null}
        <Tooltip
          title={
            !signedIn ? t('shareNeedLogin') : !resumeId ? t('shareNeedSave') : undefined
          }
        >
          <span className={`inline-flex ${canShare ? '' : 'cursor-not-allowed'}`}>
            <button
              type='button'
              disabled={actionsDisabled || !canShare}
              onClick={onShareClick}
              aria-label={t('shareAria')}
              className={`${canShare ? '' : 'pointer-events-none'} ${actionBtnCls}`}
            >
              <Share theme='outline' size={18} fill={ICON_PRIMARY} />
              {t('share')}
            </button>
          </span>
        </Tooltip>
        <span
          className='inline-flex'
          tabIndex={0}
          onPointerEnter={() => {
            void prefetchHeaderExportMenu();
            setExportMenuReady(true);
          }}
          onFocus={() => {
            void prefetchHeaderExportMenu();
            setExportMenuReady(true);
          }}
        >
          {exportMenuReady ? <HeaderExportMenu /> : <HeaderExportMenuPlaceholder />}
        </span>
        {showSaveAs ? (
          <Tooltip title={signedIn ? t('saveAsHint') : t('saveNeedLogin')}>
            <span className={`inline-flex ${signedIn ? '' : 'cursor-not-allowed'}`}>
              <button
                type='button'
                disabled={actionsDisabled || saving || !signedIn}
                onClick={() => void onSaveAs()}
                aria-label={t('saveAs')}
                className={`${signedIn ? '' : 'pointer-events-none'} ${quietBtnCls}`}
              >
                {saving ? (
                  <LoadingOutlined className='text-[13px]' />
                ) : (
                  <Copy theme='outline' size={16} fill={ICON_MUTED} />
                )}
                {t('saveAs')}
              </button>
            </span>
          </Tooltip>
        ) : null}
      </div>
      {resumeId ? (
        <ShareResumeModal
          open={shareOpen}
          resumeId={resumeId}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </div>
  );
}
export default memo(observer(Header));
