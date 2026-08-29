'use client';

import dynamic from 'next/dynamic';
import { Popover } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { LoadingOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import LoginDropdownButton from '@/components/auth/LoginDropdownButton';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { GITHUB_NEW_ISSUE_URL } from '@/lib/githubRepoStars';
import { homeFocusRing } from '@/lib/home/homeA11y';
import { toggleAppTheme } from '@/lib/themeStore';
import { BugOutlined } from '@ant-design/icons';
import { memo, useRef, useState } from 'react';

const GithubAuthButton = dynamic(() => import('@/components/auth/GithubAuthButton'), {
  ssr: false,
  loading: () => (
    <span className='inline-flex h-9 w-9 rounded-full border border-fg/14 bg-fg/[0.05]' aria-hidden />
  ),
});

const popupBodyStyle = {
  padding: 6,
  background: 'var(--antd-popup-bg)',
  border: '1px solid var(--antd-popup-border)',
  boxShadow: 'var(--panel-shadow-md)',
};

function langItemCls(active: boolean) {
  return `w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
    active
      ? 'cursor-default bg-fg/10 font-medium text-fg/90'
      : 'cursor-pointer text-fg/65 hover:bg-fg/[0.06] hover:text-fg/88'
  }`;
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' width='1em' height='1em' fill='none' stroke='currentColor' strokeWidth='1.75' aria-hidden>
      <circle cx='12' cy='12' r='9' />
      <path d='M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18' />
    </svg>
  );
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' width='1em' height='1em' fill='none' stroke='currentColor' strokeWidth='1.75' aria-hidden>
      <circle cx='12' cy='12' r='4' />
      <path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' width='1em' height='1em' fill='none' stroke='currentColor' strokeWidth='1.75' aria-hidden>
      <path d='M21 14.5A8.5 8.5 0 119.5 3 7 7 0 0021 14.5z' />
    </svg>
  );
}

export default memo(function HomeTopNavActions() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Home');
  const ta = useTranslations('Auth');
  const themeToggleOriginRef = useRef<{ x: number; y: number } | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const authLoading = status === 'loading';
  const appTheme = useResolvedTheme();
  const themeNavHint = appTheme === 'dark' ? t('themeToLight') : t('themeToDark');

  const switchLocale = (next: 'zh' | 'en') => {
    if (locale === next) return;
    router.replace(pathname, { locale: next });
    setLangOpen(false);
  };

  return (
    <div className='flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2.5'>
      <button
        type='button'
        onClick={() => window.open(GITHUB_NEW_ISSUE_URL, '_blank', 'noopener,noreferrer')}
        aria-label={t('navFeedback')}
        title={t('navFeedback')}
        className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-fg/68 transition-colors duration-200 hover:bg-fg/[0.09] hover:text-fg/88 sm:w-auto sm:gap-1.5 sm:px-3 ${homeFocusRing}`}
      >
        <BugOutlined className='text-[15px]' />
        <span className='hidden max-w-[7rem] truncate text-xs font-medium sm:inline'>
          {t('navFeedback')}
        </span>
      </button>
      <Popover
        arrow={false}
        trigger={['hover', 'click']}
        placement='bottomRight'
        mouseEnterDelay={0.08}
        mouseLeaveDelay={0.12}
        open={langOpen}
        onOpenChange={setLangOpen}
        styles={{ body: popupBodyStyle }}
        content={
          <div className='flex min-w-[148px] flex-col gap-0.5' role='menu'>
            <button
              type='button'
              role='menuitem'
              disabled={locale === 'zh'}
              onClick={() => switchLocale('zh')}
              className={langItemCls(locale === 'zh')}
            >
              {t('langZh')}
            </button>
            <button
              type='button'
              role='menuitem'
              disabled={locale === 'en'}
              onClick={() => switchLocale('en')}
              className={langItemCls(locale === 'en')}
            >
              {t('langEn')}
            </button>
          </div>
        }
      >
        <button
          type='button'
          aria-expanded={langOpen}
          aria-haspopup='menu'
          aria-label={t('langSwitch')}
          className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-fg/68 transition-colors duration-200 hover:bg-fg/[0.09] hover:text-fg/88 sm:w-auto sm:gap-1.5 sm:px-3 ${homeFocusRing}`}
        >
          <IconGlobe className='text-[15px]' />
          <span className='hidden max-w-[7rem] truncate text-xs font-medium sm:inline'>
            {locale === 'zh' ? t('langZh') : t('langEn')}
          </span>
        </button>
      </Popover>
      <button
        type='button'
        onPointerDown={(e) => {
          themeToggleOriginRef.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={(e) => {
          const origin = themeToggleOriginRef.current;
          themeToggleOriginRef.current = null;
          toggleAppTheme(origin ?? { x: e.clientX, y: e.clientY });
        }}
        aria-label={themeNavHint}
        className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-fg/14 bg-fg/[0.06] text-fg/85 transition-colors duration-200 hover:bg-fg/10 ${homeFocusRing}`}
      >
        {appTheme === 'dark' ? <IconSun className='text-[15px]' /> : <IconMoon className='text-[15px]' />}
      </button>
      {authLoading ? (
        <span
          className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-fg/55'
          aria-label={ta('loading')}
        >
          <LoadingOutlined className='text-[14px]' />
        </span>
      ) : signedIn ? (
        <GithubAuthButton variant='compact' />
      ) : (
        <LoginDropdownButton trigger={['hover', 'click']} />
      )}
    </div>
  );
});
