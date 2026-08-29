'use client';

import { LoadingOutlined } from '@ant-design/icons';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import qqIcon from '@/assets/qq.png';
import { signInPreservingResume } from '@/lib/signInPreservingResume';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-bg)]';

type Props = {
  variant?: 'home' | 'compact';
};

function QqIcon({ size }: { size: number }) {
  return (
    <Image
      src={qqIcon}
      alt=''
      width={size}
      height={size}
      className='object-contain'
      aria-hidden
    />
  );
}

/** 未登录时显示；已登录由 GithubAuthButton 统一展示账号菜单 */
export default function QqAuthButton({ variant = 'home' }: Props) {
  const t = useTranslations('Auth');
  const { status } = useSession();
  const [busy, setBusy] = useState(false);

  if (status === 'loading' || status === 'authenticated') return null;

  const onSignIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signInPreservingResume('qq');
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        type='button'
        disabled={busy}
        onClick={() => void onSignIn()}
        aria-label={t('signInQq')}
        title={t('signInQq')}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] transition-colors hover:bg-fg/[0.09] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
      >
        {busy ? <LoadingOutlined className='text-[14px]' /> : <QqIcon size={15} />}
      </button>
    );
  }

  return (
    <button
      type='button'
      disabled={busy}
      onClick={() => void onSignIn()}
      aria-label={t('signInQq')}
      className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-fg/14 bg-fg/[0.05] px-3 text-xs font-medium text-fg/65 transition-colors hover:bg-fg/[0.09] hover:text-fg/88 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
    >
      {busy ? <LoadingOutlined className='text-[14px]' /> : <QqIcon size={14} />}
      <span className='hidden sm:inline'>{t('signInQqShort')}</span>
    </button>
  );
}
