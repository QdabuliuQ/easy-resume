'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  DownOutlined,
  EditOutlined,
  GithubOutlined,
  LoadingOutlined,
  RedoOutlined,
  UndoOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Copy, SaveOne, Share } from '@icon-park/react';
import { observer } from 'mobx-react';
import { signIn, useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { memo, useId, useRef, useState } from 'react';
import { Button, Dropdown, Input, Tooltip } from 'antd';
import GithubAuthButton from '@/components/auth/GithubAuthButton';
import qqIcon from '@/assets/qq.png';
import { useAppMessage } from '@/hooks/useAppMessage';
import { cloudResumeStore, configStore } from '@/mobx';
import defaultResume from '@/json/resume.defaults';
import { localePath } from '@/lib/device';
import { logo } from '@/lib/brandAssets';
import { useEditHistory } from '@/views/edit/hooks/useEditHistory';
import ShareResumeModal from '@/views/edit/components/header/ShareResumeModal';

function MobileEditHeader() {
  const t = useTranslations('Edit.header');
  const ta = useTranslations('Auth');
  const message = useAppMessage();
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const authLoading = status === 'loading';
  const [authBusy, setAuthBusy] = useState(false);
  const { canUndo, canRedo, undo, redo } = useEditHistory();
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const ignoreNextBlur = useRef(false);
  const name = configStore.getConfig?.name ?? defaultResume.name;
  const showSave = cloudResumeStore.showSaveButton;
  const showSaveAs = cloudResumeStore.showSaveAsButton;
  const saving = cloudResumeStore.saving;
  const resumeId = cloudResumeStore.resumeId;
  const canShare = signedIn && Boolean(resumeId);
  const saveGradId = `mhdr-sg${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const signInWith = async (provider: 'github' | 'qq') => {
    if (authBusy) return;
    setAuthBusy(true);
    try {
      await signIn(provider, { redirectTo: window.location.href, redirect: true });
    } finally {
      setAuthBusy(false);
    }
  };
  const loginMenuItems = [
    {
      key: 'github',
      disabled: authBusy,
      icon: <GithubOutlined className='text-[14px]' />,
      label: ta('signInGithubShort'),
      onClick: () => void signInWith('github'),
    },
    {
      key: 'qq',
      disabled: authBusy,
      icon: (
        <Image
          src={qqIcon}
          alt=''
          width={14}
          height={14}
          className='object-contain'
          aria-hidden
        />
      ),
      label: ta('signInQqShort'),
      onClick: () => void signInWith('qq'),
    },
  ];
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
    <header className='relative shrink-0 border-b border-fg/10 px-4 pb-3 pt-3'>
      <svg width={0} height={0} className='pointer-events-none absolute' aria-hidden>
        <defs>
          <linearGradient id={saveGradId} x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='var(--color-primary-gradient-start)' />
            <stop offset='100%' stopColor='var(--color-primary)' />
          </linearGradient>
        </defs>
      </svg>
      <div className='flex items-center gap-3'>
        <Link href={localePath(locale)} className='relative flex h-10 w-10 shrink-0'>
          <Image src={logo} alt={t('logoAlt')} fill sizes='40px' className='rounded-full object-contain' />
        </Link>
        <div className='min-w-0 flex-1'>
          {editing ? (
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (ignoreNextBlur.current) return;
                commit();
              }}
              onPressEnter={commit}
              maxLength={64}
              className='!h-8'
            />
          ) : (
            <div className='flex min-w-0 items-center gap-1'>
              <p className='truncate text-[15px] font-semibold text-fg/95'>{name}</p>
              <Button
                type='text'
                size='small'
                icon={<EditOutlined />}
                aria-label={t('editNameAria')}
                className='!h-7 !w-7 !min-w-7 shrink-0 !p-0'
                onClick={() => {
                  setDraft(name);
                  setEditing(true);
                }}
              />
            </div>
          )}
        </div>
        {showSave ? (
          <Tooltip title={signedIn ? undefined : t('saveNeedLogin')}>
            <span className={`inline-flex ${signedIn ? '' : 'cursor-not-allowed'}`}>
              <Button
                type='default'
                size='small'
                loading={saving}
                disabled={!signedIn}
                icon={
                  saving ? undefined : (
                    <SaveOne theme='outline' size={16} fill={`url(#${saveGradId})`} />
                  )
                }
                onClick={() => void onSave()}
                className='!border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]'
              >
                <span className='bg-gradient-primary bg-clip-text font-semibold text-transparent'>
                  {saving ? t('saving') : t('save')}
                </span>
              </Button>
            </span>
          </Tooltip>
        ) : null}
        {showSaveAs ? (
          <Tooltip title={signedIn ? undefined : t('saveNeedLogin')}>
            <span className={`inline-flex ${signedIn ? '' : 'cursor-not-allowed'}`}>
              <Button
                type='default'
                size='small'
                loading={saving}
                disabled={!signedIn}
                icon={
                  saving ? undefined : (
                    <Copy theme='outline' size={16} fill={`url(#${saveGradId})`} />
                  )
                }
                onClick={() => void onSaveAs()}
                className='!border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]'
              >
                <span className='bg-gradient-primary bg-clip-text font-semibold text-transparent'>
                  {saving ? t('saving') : t('saveAs')}
                </span>
              </Button>
            </span>
          </Tooltip>
        ) : null}
        <Tooltip
          title={
            !signedIn ? t('shareNeedLogin') : !resumeId ? t('shareNeedSave') : undefined
          }
        >
          <span className={`inline-flex ${canShare ? '' : 'cursor-not-allowed'}`}>
            <Button
              type='text'
              size='small'
              icon={<Share theme='outline' size={16} fill={`url(#${saveGradId})`} />}
              aria-label={t('shareAria')}
              disabled={!canShare}
              onClick={onShareClick}
              className='!h-8 !w-8 !min-w-8 !p-0 !border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]'
            />
          </span>
        </Tooltip>
        {authLoading ? (
          <span
            className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-fg/55'
            aria-label={ta('loading')}
          >
            <LoadingOutlined className='text-[14px]' />
          </span>
        ) : signedIn ? (
          <GithubAuthButton variant='compact' />
        ) : (
          <Dropdown
            menu={{ items: loginMenuItems }}
            trigger={['hover', 'click']}
            mouseEnterDelay={0.08}
            mouseLeaveDelay={0.12}
            disabled={authBusy}
            placement='bottomRight'
            open={loginOpen}
            onOpenChange={setLoginOpen}
          >
            <button
              type='button'
              disabled={authBusy}
              aria-label={ta('signIn')}
              aria-expanded={loginOpen}
              className='relative isolate inline-flex h-8 cursor-pointer items-center gap-1 overflow-hidden rounded-lg border-0 bg-gradient-to-r from-[var(--color-primary-gradient-start)] to-[var(--color-primary)] px-2.5 text-[12px] font-semibold text-white outline-none shadow-[0_4px_14px_color-mix(in_srgb,var(--color-primary)_36%,transparent)] disabled:opacity-50'
            >
              {authBusy ? (
                <LoadingOutlined className='text-[12px] text-white' />
              ) : (
                <UserOutlined className='text-[12px] text-white' />
              )}
              {ta('signIn')}
              {!authBusy ? (
                <DownOutlined
                  className={`text-[9px] text-white/85 transition-transform duration-200 ${loginOpen ? 'rotate-180' : ''}`}
                />
              ) : null}
            </button>
          </Dropdown>
        )}
      </div>
      <div className='pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1'>
        <Button
          type='text'
          size='small'
          icon={<UndoOutlined />}
          aria-label={t('undoAria')}
          disabled={!canUndo}
          onClick={undo}
          className='pointer-events-auto !h-8 !w-8 !min-w-8 !p-0 enabled:cursor-pointer disabled:!cursor-not-allowed'
        />
        <Button
          type='text'
          size='small'
          icon={<RedoOutlined />}
          aria-label={t('redoAria')}
          disabled={!canRedo}
          onClick={redo}
          className='pointer-events-auto !h-8 !w-8 !min-w-8 !p-0 enabled:cursor-pointer disabled:!cursor-not-allowed'
        />
      </div>
      {resumeId ? (
        <ShareResumeModal
          open={shareOpen}
          resumeId={resumeId}
          onClose={() => setShareOpen(false)}
        />
      ) : null}
    </header>
  );
}

export default memo(observer(MobileEditHeader));
