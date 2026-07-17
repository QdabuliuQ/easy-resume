'use client';

import Image from 'next/image';
import { GithubOutlined, LoadingOutlined, LogoutOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-bg)]';

type Props = {
  variant?: 'home' | 'compact';
};

export default function GithubAuthButton({ variant = 'home' }: Props) {
  const t = useTranslations('Auth');
  const { data: session, status } = useSession();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const onSignIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signIn('github', { redirectTo: window.location.href });
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    if (busy) return;
    setBusy(true);
    setMenuOpen(false);
    try {
      await signOut({ redirectTo: window.location.href });
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return (
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-fg/55 ${focusRing}`}
        aria-label={t('loading')}
      >
        <LoadingOutlined className='text-[14px]' />
      </span>
    );
  }

  if (session?.user) {
    const name = session.user.name || session.user.login || t('signedIn');
    const avatar = session.user.image;
    return (
      <Popover
        arrow={false}
        trigger='click'
        open={menuOpen}
        onOpenChange={setMenuOpen}
        placement='bottomRight'
        styles={{ body: { padding: 8 } }}
        content={
          <div className='flex min-w-[160px] flex-col gap-1'>
            <div className='px-3 py-2'>
              <p className='truncate text-sm font-medium text-fg/90'>{name}</p>
              {session.user.login ? (
                <p className='truncate text-xs text-fg/50'>@{session.user.login}</p>
              ) : null}
            </div>
            <button
              type='button'
              disabled={busy}
              onClick={() => void onSignOut()}
              className='inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-fg/70 transition-colors hover:bg-fg/[0.06] hover:text-fg/90 disabled:cursor-not-allowed disabled:opacity-50'
            >
              {busy ? <LoadingOutlined /> : <LogoutOutlined />}
              {t('signOut')}
            </button>
          </div>
        }
      >
        <button
          type='button'
          aria-label={t('accountMenu')}
          aria-expanded={menuOpen}
          className={`inline-flex h-9 items-center gap-1.5 rounded-full p-0 text-fg/70 transition-opacity hover:opacity-90 sm:gap-2 ${focusRing}`}
        >
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              width={36}
              height={36}
              className='h-9 w-9 rounded-full object-cover'
            />
          ) : (
            <span className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-fg/10 text-xs font-semibold'>
              {(name[0] || 'U').toUpperCase()}
            </span>
          )}
          {variant === 'home' ? (
            <span className='hidden max-w-[6.5rem] truncate text-xs font-medium sm:inline'>
              {name}
            </span>
          ) : null}
        </button>
      </Popover>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type='button'
        disabled={busy}
        onClick={() => void onSignIn()}
        aria-label={t('signInGithub')}
        title={t('signInGithub')}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-fg/68 transition-colors hover:bg-fg/[0.09] hover:text-fg/88 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
      >
        {busy ? <LoadingOutlined className='text-[14px]' /> : <GithubOutlined className='text-[15px]' />}
      </button>
    );
  }

  return (
    <button
      type='button'
      disabled={busy}
      onClick={() => void onSignIn()}
      aria-label={t('signInGithub')}
      className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-fg/14 bg-fg/[0.05] px-3 text-xs font-medium text-fg/65 transition-colors hover:bg-fg/[0.09] hover:text-fg/88 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
    >
      {busy ? <LoadingOutlined className='text-[14px]' /> : <GithubOutlined className='text-[14px]' />}
      <span className='hidden sm:inline'>{t('signIn')}</span>
    </button>
  );
}
