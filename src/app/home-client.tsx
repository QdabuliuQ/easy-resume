'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from 'react';
import { bgDark, bgLight, logo, PHOTOS, PHOTO_SIZES } from '@/lib/brandAssets';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeAppTheme,
  toggleAppTheme,
} from '@/lib/themeStore';

const HomeResumeTemplateScroll = dynamic(
  () => import('@/components/homeResumeTemplateScroll'),
  {
    ssr: false,
    loading: () => (
      <div
        className='relative w-full border-y border-fg/10 bg-[rgb(var(--surface-fg-rgb)/0.03)] h-[calc(100vh-env(safe-area-inset-top,0px)-3.5rem)] sm:h-[calc(100vh-env(safe-area-inset-top,0px)-4rem)]'
        aria-hidden
      />
    ),
  },
);

const HeroPreviewCompare = dynamic(() => import('@/components/heroPreviewCompare'), {
  ssr: false,
  loading: () => (
    <div className='mx-auto aspect-[16/9] w-full max-w-4xl rounded-xl bg-fg/[0.04]' aria-hidden />
  ),
});

const HomeRevealScope = dynamic(() => import('@/components/homeRevealScope'), {
  ssr: true,
});

const HeroTypingTitle = dynamic(() => import('@/components/home/HeroTypingTitle'), {
  ssr: false,
});

const HeroMagneticCta = dynamic(() => import('@/components/home/HeroMagneticCta'), {
  ssr: false,
});

const GithubAuthButton = dynamic(() => import('@/components/auth/GithubAuthButton'), {
  ssr: false,
  loading: () => (
    <span className='inline-flex h-9 w-9 rounded-full border border-fg/14 bg-fg/[0.05]' aria-hidden />
  ),
});

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-bg)]';

const IconGithub = memo(function IconGithub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 16 16' width='1em' height='1em' fill='currentColor' aria-hidden>
      <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z' />
    </svg>
  );
});

const IconGlobe = memo(function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' width='1em' height='1em' fill='none' stroke='currentColor' strokeWidth='1.75' aria-hidden>
      <circle cx='12' cy='12' r='9' />
      <path d='M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18' />
    </svg>
  );
});

const IconSun = memo(function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' width='1em' height='1em' fill='none' stroke='currentColor' strokeWidth='1.75' aria-hidden>
      <circle cx='12' cy='12' r='4' />
      <path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
    </svg>
  );
});

const IconMoon = memo(function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' width='1em' height='1em' fill='none' stroke='currentColor' strokeWidth='1.75' aria-hidden>
      <path d='M21 14.5A8.5 8.5 0 119.5 3 7 7 0 0021 14.5z' />
    </svg>
  );
});

const IconDown = memo(function IconDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 24 24' width='1em' height='1em' fill='none' stroke='currentColor' strokeWidth='2' aria-hidden>
      <path d='M6 9l6 6 6-6' />
    </svg>
  );
});

type HighlightBlock = {
  title: string;
  desc: string;
  bullets: [string, string];
};

function StaticHeroTitle({ line }: { line: string }) {
  return (
    <h1 className='min-h-[2.2lh] max-w-full px-2 text-center text-[1.625rem] font-semibold leading-[1.2] tracking-tight text-balance text-fg/96 sm:px-0 sm:text-4xl md:min-h-[1.15lh] md:text-[clamp(2.25rem,4vw+1rem,3.75rem)]'>
      {line}
    </h1>
  );
}

function StaticCta({
  label,
  onClick,
  onKeyDown,
}: {
  label: string;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLSpanElement>) => void;
}) {
  return (
    <span
      role='button'
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`inline-flex h-12 min-w-[158px] cursor-pointer items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgb(var(--surface-fg-rgb)/0.12)] ${focusRing}`}
      style={{ background: 'var(--gradient-primary)' }}
    >
      {label}
    </span>
  );
}

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Home');
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const highlights = t.raw('highlights') as HighlightBlock[];
  const faq = t.raw('faq') as { q: string; a: string }[];
  const heroLines = t.raw('heroLines') as string[];
  const moduleTags = t.raw('moduleTags') as string[];
  const themeSnap = useSyncExternalStore(
    subscribeAppTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [, appTheme] = themeSnap.split('|') as ['dark' | 'light' | 'system', 'dark' | 'light'];
  const themeNavHint = appTheme === 'dark' ? t('themeToLight') : t('themeToDark');
  const reduceMotion = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
  const [scrolled, setScrolled] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [pointerPos, setPointerPos] = useState(() => ({
    x: typeof window === 'undefined' ? 0 : window.innerWidth / 2,
    y: typeof window === 'undefined' ? 0 : window.innerHeight / 2,
  }));
  const themeToggleOriginRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [langOpen]);

  useEffect(() => {
    let raf: number | null = null;
    let pending: { x: number; y: number } | null = null;
    const flush = () => {
      raf = null;
      if (!pending) return;
      setPointerPos(pending);
      pending = null;
    };
    const onMove = (e: MouseEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (raf != null) return;
      raf = requestAnimationFrame(flush);
    };
    const onLeave = () => {
      pending = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      if (raf != null) return;
      raf = requestAnimationFrame(flush);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navClass = useMemo(
    () =>
      `fixed top-0 left-0 right-0 z-50 isolate w-full bg-[var(--editor-shell-bg)]/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl transition-[background,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        scrolled
          ? 'border-b border-fg/10 shadow-[0_12px_36px_rgb(var(--surface-fg-rgb)/0.08)]'
          : 'border-b border-fg/[0.06]'
      }`,
    [scrolled],
  );

  const navStyle = scrolled
    ? {
        background:
          'linear-gradient(90deg, color-mix(in srgb, var(--editor-shell-bg) 92%, black), color-mix(in srgb, var(--color-primary) 16%, var(--editor-shell-bg)), color-mix(in srgb, var(--editor-shell-bg) 88%, black))',
      }
    : undefined;

  const navKey =
    (fn: () => void) =>
    (e: KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fn();
      }
    };
  const pushPath = (path: string) => () => router.push(path);
  const openGh = () =>
    window.open('https://github.com/QdabuliuQ/easy-resume', '_blank', 'noopener,noreferrer');
  const startEdit = pushPath('/edit');

  return (
    <main className='relative min-h-screen bg-[var(--editor-shell-bg)] text-[var(--text-strong)]'>
      <div className='pointer-events-none absolute inset-0 z-0 overflow-hidden'>
        <img
          src={appTheme === 'dark' ? bgDark : bgLight}
          alt=''
          aria-hidden='true'
          className='fixed inset-0 w-[100vw]'
        />
        <div
          className='absolute -left-[14vw] -top-[16vh] h-[52vh] w-[52vh] rounded-full blur-3xl'
          style={{
            background: 'var(--home-glow-a)',
            opacity: 'var(--home-glow-a-opacity)',
          }}
        />
        <div
          className='absolute -bottom-[20vh] right-[-10vw] h-[48vh] w-[48vh] rounded-full blur-3xl'
          style={{
            background: 'var(--home-glow-b)',
            opacity: 'var(--home-glow-b-opacity)',
          }}
        />
      </div>

      <header className={navClass} style={navStyle}>
        <div className='mx-auto flex h-14 w-full min-w-0 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-5'>
          <span
            role='link'
            tabIndex={0}
            aria-label={t('navHome')}
            onClick={pushPath('/')}
            onKeyDown={navKey(pushPath('/'))}
            className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 overflow-hidden rounded-lg ${focusRing}`}
          >
            <span className='relative inline-flex h-10 w-10 shrink-0'>
              <Image src={logo} alt={t('logoAlt')} fill sizes='40px' className='object-contain p-0.5' />
            </span>
            <span className='min-w-0 truncate leading-tight'>
              <span className='block truncate text-sm font-semibold tracking-[0.12em] text-fg/90'>
                {t('brandName')}
              </span>
              <span className='block truncate text-[11px] font-medium tracking-[0.08em] text-fg/58'>
                {locale === 'zh' ? 'EasyResume' : '青松简历'}
              </span>
            </span>
          </span>
          <div className='flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2.5'>
            <span
              role='button'
              tabIndex={0}
              aria-label={t('navGh')}
              onClick={openGh}
              onKeyDown={navKey(openGh)}
              className={`hidden h-9 cursor-pointer items-center gap-1.5 rounded-full border border-fg/14 bg-fg/[0.05] px-3 text-xs font-medium text-fg/65 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-fg/[0.09] hover:text-fg/88 sm:inline-flex ${focusRing}`}
            >
              <IconGithub className='text-[14px]' />
              {t('navGhShort')}
            </span>
            <div ref={langRef} className='relative'>
              <button
                type='button'
                aria-expanded={langOpen}
                aria-haspopup='dialog'
                aria-label={t('langSwitch')}
                onClick={() => setLangOpen((v) => !v)}
                className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-fg/68 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-fg/[0.09] hover:text-fg/88 sm:w-auto sm:gap-1.5 sm:px-3 ${focusRing}`}
              >
                <IconGlobe className='text-[15px]' />
                <span className='hidden max-w-[7rem] truncate text-xs font-medium sm:inline'>
                  {locale === 'zh' ? t('langZh') : t('langEn')}
                </span>
              </button>
              {langOpen ? (
                <div className='absolute right-0 top-[calc(100%+6px)] z-50 flex min-w-[148px] flex-col gap-0.5 rounded-xl border border-fg/12 bg-[var(--editor-shell-panel-strong)] p-2 shadow-[0_12px_32px_rgb(var(--surface-fg-rgb)/0.12)]'>
                  <button
                    type='button'
                    disabled={locale === 'zh'}
                    onClick={() => {
                      if (locale === 'zh') return;
                      router.replace(pathname, { locale: 'zh' });
                      setLangOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      locale === 'zh'
                        ? 'cursor-default bg-fg/10 font-medium text-fg/90'
                        : 'cursor-pointer text-fg/65 hover:bg-fg/[0.06]'
                    }`}
                  >
                    {t('langZh')}
                  </button>
                  <button
                    type='button'
                    disabled={locale === 'en'}
                    onClick={() => {
                      if (locale === 'en') return;
                      router.replace(pathname, { locale: 'en' });
                      setLangOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      locale === 'en'
                        ? 'cursor-default bg-fg/10 font-medium text-fg/90'
                        : 'cursor-pointer text-fg/65 hover:bg-fg/[0.06]'
                    }`}
                  >
                    {t('langEn')}
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type='button'
              onPointerDown={(e) => {
                themeToggleOriginRef.current = { x: e.clientX, y: e.clientY };
              }}
              onClick={(e) => {
                const origin = themeToggleOriginRef.current;
                themeToggleOriginRef.current = null;
                if (origin) {
                  toggleAppTheme(origin);
                  return;
                }
                toggleAppTheme({ x: e.clientX, y: e.clientY });
              }}
              aria-label={themeNavHint}
              className={`cursor-pointer inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-fg/14 bg-fg/[0.06] text-fg/85 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-fg/10 ${focusRing}`}
            >
              {appTheme === 'dark' ? (
                <IconSun className='text-[15px]' />
              ) : (
                <IconMoon className='text-[15px]' />
              )}
            </button>
            <GithubAuthButton />
          </div>
        </div>
      </header>

      <div className='relative z-[1]'>
        <section className='relative mx-auto min-h-[88vh] w-full max-w-6xl items-center px-5 pb-10 pt-[calc(3.5rem+env(safe-area-inset-top,0px)+1.25rem)] md:min-h-[90vh] md:pb-24 md:pt-32'>
          <div className='mb-[100px] flex w-full items-center justify-center'>
            <div className='flex flex-col items-center justify-center'>
              <p
                className='mb-[20px] inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] tracking-[0.14em]'
                style={{
                  border:
                    '1px solid color-mix(in srgb, var(--color-primary-gradient-start) 34%, transparent)',
                  background:
                    'color-mix(in srgb, var(--color-primary-gradient-start) 12%, transparent)',
                  color:
                    'color-mix(in srgb, var(--color-primary-gradient-start) 52%, var(--text-strong))',
                }}
              >
                {t('heroBadge')}
              </p>
              {hydrated ? (
                <HeroTypingTitle reduceMotion={reduceMotion} lines={heroLines} />
              ) : (
                <StaticHeroTitle line={heroLines[0] || ''} />
              )}
              <p className='mt-[15px] max-w-[62ch] text-center text-base leading-[1.75] text-fg/58 md:text-[17px]'>
                {t('heroSub')}
              </p>
              <div className='mt-[15px]'>
                {hydrated ? (
                  <HeroMagneticCta
                    reduceMotion={reduceMotion}
                    label={t('ctaStart')}
                    onClick={startEdit}
                    onKeyDown={navKey(startEdit)}
                    focusRing={focusRing}
                  />
                ) : (
                  <StaticCta label={t('ctaStart')} onClick={startEdit} onKeyDown={navKey(startEdit)} />
                )}
              </div>
            </div>
          </div>

          <HeroPreviewCompare
            reduceMotion={reduceMotion}
            compareFigure={t('compareFigure')}
            compareSlider={t('compareSlider')}
            previewLightAlt={t('previewLightAlt')}
            previewDarkAlt={t('previewDarkAlt')}
            focusRingClass={focusRing}
            pointerX={pointerPos.x}
            pointerY={pointerPos.y}
          />
        </section>

        <div className='relative w-full overflow-x-hidden'>
          <HomeResumeTemplateScroll reduceMotion={reduceMotion} />
        </div>

        <HomeRevealScope reduceMotion={reduceMotion}>
          <section
            id='features'
            className='scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] border-t border-fg/[0.07] md:scroll-mt-[72px]'
          >
            <div className='mx-auto max-w-6xl px-5 py-16 md:py-20'>
              <div data-home-reveal className='max-w-[52ch]'>
                <h2 className='text-2xl font-semibold tracking-tight text-fg/94 md:text-[1.75rem]'>
                  {t('featuresTitle')}
                </h2>
                <p className='mt-3 text-sm leading-7 text-fg/56 md:text-[15px]'>{t('featuresDesc')}</p>
              </div>

              <div className='mt-14 flex flex-col gap-16 md:gap-20'>
                {highlights.map((block, idx) => (
                  <div
                    key={block.title}
                    className='grid items-center gap-10 lg:grid-cols-2 lg:gap-14'
                  >
                    <div data-home-reveal className={idx === 1 ? 'lg:order-2' : ''}>
                      <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-fg/38'>
                        {String(idx + 1).padStart(2, '0')}
                      </p>
                      <h3 className='mt-2 text-xl font-semibold text-fg/92 md:text-2xl'>
                        {block.title}
                      </h3>
                      <p className='mt-3 max-w-[54ch] text-sm leading-7 text-fg/58 md:text-[15px]'>
                        {block.desc}
                      </p>
                      <ul className='mt-5 space-y-2.5 text-sm text-fg/62'>
                        <li className='flex gap-2.5'>
                          <span className='mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-primary)]' />
                          <span>{block.bullets[0]}</span>
                        </li>
                        <li className='flex gap-2.5'>
                          <span className='mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-primary-gradient-start)]' />
                          <span>{block.bullets[1]}</span>
                        </li>
                      </ul>
                    </div>
                    <div data-home-reveal className={idx === 1 ? 'lg:order-1' : ''}>
                      <Image
                        src={
                          appTheme === 'dark'
                            ? PHOTOS[`photo${idx + 1}Dark` as 'photo1Dark' | 'photo2Dark']
                            : PHOTOS[`photo${idx + 1}Light` as 'photo1Light' | 'photo2Light']
                        }
                        alt={block.title}
                        width={PHOTO_SIZES[`photo${idx + 1}` as 'photo1' | 'photo2'].width}
                        height={PHOTO_SIZES[`photo${idx + 1}` as 'photo1' | 'photo2'].height}
                        className='h-auto w-full rounded-xl object-cover'
                        sizes='(max-width: 1024px) 100vw, 50vw'
                        loading='lazy'
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div data-home-reveal className='mt-16 md:mt-20'>
                <div className='rounded-2xl border border-[var(--editor-shell-border)] bg-[var(--editor-shell-panel)] px-6 py-8 transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-fg/14 hover:shadow-[var(--editor-shell-shadow)] md:flex md:items-start md:justify-between md:gap-10 md:px-10 md:py-10'>
                  <div className='max-w-[52ch]'>
                    <h3 className='text-lg font-semibold text-fg/92 md:text-xl'>{t('moduleTitle')}</h3>
                    <p className='mt-2 text-sm leading-7 text-fg/58 md:text-[15px]'>{t('moduleDesc')}</p>
                  </div>
                  <div className='mt-6 flex flex-wrap gap-2 md:mt-0 md:max-w-[340px] md:justify-end'>
                    {moduleTags.map((label) => (
                      <span
                        key={label}
                        className='rounded-full border border-fg/12 bg-fg/[0.04] px-3 py-1.5 text-xs font-medium text-fg/68'
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className='border-t border-fg/[0.07] bg-[rgb(var(--surface-fg-rgb)/0.02)]'>
            <div className='mx-auto max-w-6xl px-5 py-16 md:py-20'>
              <div data-home-reveal className='max-w-xl'>
                <h2 className='text-2xl font-semibold tracking-tight text-fg/94 md:text-[1.75rem]'>
                  {t('faqTitle')}
                </h2>
                <p className='mt-2 text-sm leading-relaxed text-fg/56'>{t('faqDesc')}</p>
              </div>
              <div className='mt-10 grid items-start gap-4 sm:grid-cols-2 lg:mt-12 lg:gap-5'>
                {faq.map((item) => (
                  <details
                    key={item.q}
                    data-home-reveal
                    className='group rounded-xl border border-[var(--editor-shell-border)] bg-[var(--editor-shell-panel-strong)] px-5 py-[18px] open:border-fg/14 open:shadow-[0_12px_32px_rgb(var(--surface-fg-rgb)/0.06)] hover:border-fg/12'
                  >
                    <summary
                      className={`flex cursor-pointer list-none items-start justify-between gap-3 marker:hidden [&::-webkit-details-marker]:hidden ${focusRing}`}
                    >
                      <span className='min-w-0 flex-1 text-[15px] font-medium leading-snug text-fg/90'>
                        {item.q}
                      </span>
                      <IconDown className='mt-0.5 shrink-0 text-[11px] text-fg/38 transition-transform group-open:rotate-180' />
                    </summary>
                    <p className='mt-4 border-t border-fg/[0.06] pt-4 text-sm leading-relaxed text-fg/58'>
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className='mx-auto max-w-6xl px-5 pb-14 pt-6 md:pb-16'>
            <div
              data-home-reveal
              className='overflow-hidden rounded-3xl px-6 py-12 text-center md:px-12 md:py-14'
              style={{ background: 'var(--gradient-primary)', WebkitBackfaceVisibility: 'hidden' }}
            >
              <h2 className='text-xl font-semibold text-white md:text-2xl'>{t('closingTitle')}</h2>
              <p className='mx-auto mt-3 max-w-[48ch] text-sm leading-7 text-white/85'>
                {t('closingDesc')}
              </p>
              <span
                role='button'
                tabIndex={0}
                onClick={startEdit}
                onKeyDown={navKey(startEdit)}
                className={`mt-8 inline-flex h-11 min-h-11 min-w-[148px] cursor-pointer items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-[rgb(30_26_33/0.92)] shadow-[0_12px_28px_rgb(0_0_0/0.18)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:shadow-[0_14px_32px_rgb(0_0_0/0.22)] motion-reduce:hover:translate-y-0 active:translate-y-0 ${focusRing}`}
              >
                {t('closingCta')}
              </span>
            </div>
          </section>

          <footer
            data-home-reveal
            aria-label='Site footer'
            className='mx-auto max-w-6xl px-5 pb-10 md:pb-12'
          >
            <div className='relative flex flex-col items-center pt-8'>
              <div
                aria-hidden
                className='pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-primary)_32%,var(--editor-shell-border)),transparent)] md:inset-x-16'
              />
              <a
                href='https://beian.miit.gov.cn/'
                target='_blank'
                rel='noopener noreferrer'
                className={`group inline-flex items-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,var(--editor-shell-border))] bg-[var(--editor-shell-panel-soft)] px-4 py-2.5 text-[13px] tracking-wide text-[var(--color-primary)] shadow-[inset_0_1px_0_rgb(var(--surface-fg-rgb)/0.04)] backdrop-blur-sm transition-[color,border-color,background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--color-primary)_32%,var(--editor-shell-border))] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--editor-shell-panel))] hover:text-[color-mix(in_srgb,var(--color-primary)_92%,white)] hover:shadow-[0_10px_28px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] motion-reduce:hover:translate-y-0 ${focusRing}`}
              >
                <span
                  aria-hidden
                  className='h-1.5 w-1.5 shrink-0 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] shadow-[0_0_10px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]'
                />
                <span className='text-[var(--color-primary)]'>粤ICP备2026060117号</span>
              </a>
            </div>
          </footer>
        </HomeRevealScope>
      </div>
    </main>
  );
}
