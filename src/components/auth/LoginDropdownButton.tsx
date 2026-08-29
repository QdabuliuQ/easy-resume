'use client';

import Image from 'next/image';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { DownOutlined, GithubOutlined, LoadingOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { memo, useMemo, useState } from 'react';
import qqIcon from '@/assets/qq.png';
import { signInPreservingResume } from '@/lib/signInPreservingResume';

export const loginBtnCls = [
  'inline-flex h-9 cursor-pointer select-none items-center gap-2 rounded-full py-0 pl-1 pr-3',
  'border border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)]',
  'bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--editor-shell-panel-strong))]',
  'text-[12px] font-semibold leading-none tracking-[0.01em] text-[color:var(--color-primary)] whitespace-nowrap outline-none',
  'shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]',
  'transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out',
  'hover:border-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]',
  'hover:bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--editor-shell-panel-strong))]',
  'hover:shadow-[0_6px_16px_color-mix(in_srgb,var(--color-primary)_18%,transparent),inset_0_1px_0_rgb(255_255_255/0.08)]',
  'active:scale-[0.98]',
  'focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-bg)]',
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
  'motion-reduce:transition-none motion-reduce:active:scale-100',
].join(' ');

export const loginIconCls =
  'inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-gradient-start),var(--color-primary))] text-white shadow-[0_2px_8px_color-mix(in_srgb,var(--color-primary)_32%,transparent),inset_0_1px_0_rgb(255_255_255/0.35)]';

export const loginArrowCls = (open: boolean) =>
  `text-[10px] text-[color:color-mix(in_srgb,var(--color-primary)_72%,transparent)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`;

type Props = {
  trigger?: ('hover' | 'click')[];
};

function LoginDropdownButton({ trigger = ['hover'] }: Props) {
  const ta = useTranslations('Auth');
  const [loginOpen, setLoginOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  const signInWith = async (provider: 'github' | 'qq') => {
    if (authBusy) return;
    setAuthBusy(true);
    try {
      await signInPreservingResume(provider);
    } finally {
      setAuthBusy(false);
    }
  };

  const loginMenuItems: MenuProps['items'] = useMemo(
    () => [
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
          <Image src={qqIcon} alt='' width={14} height={14} className='object-contain' aria-hidden />
        ),
        label: ta('signInQqShort'),
        onClick: () => void signInWith('qq'),
      },
    ],
    [authBusy, ta],
  );

  const menuClassName = [
    '!bg-[var(--antd-popup-bg)] !p-1.5 !rounded-xl',
    '!border !border-solid !border-[var(--antd-popup-border)]',
    '!shadow-[var(--panel-shadow-md)]',
    '[&_.ant-dropdown-menu-item]:!rounded-lg [&_.ant-dropdown-menu-item]:!text-fg/80',
    '[&_.ant-dropdown-menu-item:hover]:!bg-fg/[0.06] [&_.ant-dropdown-menu-item:hover]:!text-fg/92',
    '[&_.ant-dropdown-menu-item-disabled]:!opacity-50',
  ].join(' ');

  return (
    <Dropdown
      menu={{ items: loginMenuItems, className: menuClassName }}
      trigger={trigger}
      mouseEnterDelay={0.08}
      mouseLeaveDelay={0.12}
      disabled={authBusy}
      placement='bottomRight'
      open={loginOpen}
      onOpenChange={setLoginOpen}
      overlayClassName='[&_.ant-dropdown-menu]:!bg-[var(--antd-popup-bg)]'
    >
      <button
        type='button'
        disabled={authBusy}
        aria-label={ta('signIn')}
        aria-expanded={loginOpen}
        className={loginBtnCls}
      >
        <span className={loginIconCls} aria-hidden>
          {authBusy ? (
            <LoadingOutlined className='text-[12px]' />
          ) : (
            <UserOutlined className='text-[12px]' />
          )}
        </span>
        {ta('signIn')}
        {!authBusy ? <DownOutlined className={loginArrowCls(loginOpen)} /> : null}
      </button>
    </Dropdown>
  );
}

export default memo(LoginDropdownButton);
