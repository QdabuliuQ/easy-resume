'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
import { logo, PHOTOS, PHOTO_SIZES } from '@/lib/brandAssets';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeAppTheme,
  toggleAppTheme,
} from '@/lib/themeStore';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const TemplateMasonry = dynamic(() => import('@/components/home/TemplateMasonry'), {
  ssr: false,
  loading: () => <div className='h-full w-full bg-fg/[0.03]' aria-hidden />,
});

const HeroTypingTitle = dynamic(() => import('@/components/home/HeroTypingTitle'), {
  ssr: false,
});

const GithubAuthButton = dynamic(() => import('@/components/auth/GithubAuthButton'), {
  ssr: false,
  loading: () => (
    <span className='inline-flex h-9 w-9 rounded-full border border-fg/14 bg-fg/[0.05]' aria-hidden />
  ),
});

const QqAuthButton = dynamic(() => import('@/components/auth/QqAuthButton'), {
  ssr: false,
});

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-bg)]';

const HomeRightBackdrop = memo(function HomeRightBackdrop() {
  return (
    <div className='pointer-events-none fixed inset-y-0 right-0 z-0 w-full overflow-hidden xl:w-1/2' aria-hidden>
      <div className='absolute -left-[10%] top-[6%] h-[44%] w-[58%] rounded-[2rem] bg-[color-mix(in_srgb,var(--color-primary-gradient-start)_16%,transparent)] blur-3xl' />
      <div className='absolute -right-[6%] top-[34%] h-[36%] w-[46%] rounded-[1.75rem] bg-[color-mix(in_srgb,var(--color-primary)_13%,transparent)] blur-3xl' />
      <div className='absolute bottom-[8%] left-[4%] h-[30%] w-[40%] rounded-full bg-[color-mix(in_srgb,var(--color-primary)_9%,transparent)] blur-3xl' />
      <div className='absolute right-[8%] top-[12%] h-32 w-32 rotate-12 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary-gradient-start)_24%,transparent)]' />
      <div className='absolute left-[12%] top-[46%] h-24 w-40 -rotate-[8deg] rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]' />
      <div className='absolute right-[20%] top-[58%] h-20 w-20 rotate-[22deg] rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]' />
      <div className='absolute bottom-[18%] left-[28%] h-14 w-14 rounded-full bg-[color-mix(in_srgb,var(--color-primary-gradient-start)_20%,transparent)]' />
      <div className='absolute right-[12%] bottom-[10%] h-28 w-16 rotate-[14deg] rounded-3xl bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]' />
      <div className='absolute inset-x-[8%] top-[68%] h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] to-transparent' />
    </div>
  );
});

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

export default function HomeClient({ githubStars = null }: { githubStars?: number | null }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Home');
  const [langOpen, setLangOpen] = useState(false);
  const highlights = t.raw('highlights') as HighlightBlock[];
  const heroLines = t.raw('heroLines') as string[];
  const faq = t.raw('faq') as { q: string; a: string }[];
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
  const themeToggleOriginRef = useRef<{ x: number; y: number } | null>(null);

  useGSAP(
    () => {
      if (reduceMotion) return;
      const root = rootRef.current;
      if (!root) return;
      const reveals = gsap.utils.toArray<HTMLElement>('[data-home-neo-reveal]', root);
      if (!reveals.length) return;
      gsap.set(reveals, { autoAlpha: 0, y: 24 });
      for (const el of reveals) {
        gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      }
    },
    { scope: rootRef, dependencies: [reduceMotion], revertOnUpdate: true },
  );

  useEffect(() => {
    if (!langOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [langOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const headerShellClass =
    'pointer-events-none fixed left-0 top-0 z-50 w-full pt-[calc(env(safe-area-inset-top,0px)+12px)] xl:left-1/2 xl:w-1/2 xl:px-5';
  const navClass = useMemo(
    () =>
      `pointer-events-auto mx-4 flex h-14 min-w-0 items-center justify-between gap-2 rounded-2xl border px-4 backdrop-blur-xl transition-[background,border-color,box-shadow] duration-300 sm:h-16 sm:px-5 xl:mx-0 ${
        scrolled
          ? 'border-fg/14 bg-[var(--editor-shell-bg)]/78 shadow-[0_14px_38px_rgb(var(--surface-fg-rgb)/0.1)]'
          : 'border-fg/10 bg-[var(--editor-shell-bg)]/52 shadow-[0_8px_28px_rgb(var(--surface-fg-rgb)/0.07)]'
      }`,
    [scrolled],
  );

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
    <main ref={rootRef} className='relative min-h-screen bg-[var(--editor-shell-bg)] text-[var(--text-strong)]'>
      <header className={headerShellClass}>
        <div className={navClass}>
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
              <span className='block truncate text-sm font-semibold tracking-[0.12em] text-fg/90'>{t('brandName')}</span>
              <span className='block truncate text-[11px] font-medium tracking-[0.08em] text-fg/58'>{locale === 'zh' ? 'EasyResume' : '青松简历'}</span>
            </span>
          </span>
          <div className='flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2.5'>
            <div ref={langRef} className='relative'>
              <button
                type='button'
                aria-expanded={langOpen}
                aria-haspopup='dialog'
                aria-label={t('langSwitch')}
                onClick={() => setLangOpen((v) => !v)}
                className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-fg/68 transition-colors duration-200 hover:bg-fg/[0.09] hover:text-fg/88 sm:w-auto sm:gap-1.5 sm:px-3 ${focusRing}`}
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
                      if (locale !== 'zh') router.replace(pathname, { locale: 'zh' });
                      setLangOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-left text-sm ${locale === 'zh' ? 'bg-fg/10 font-medium text-fg/90' : 'text-fg/65 hover:bg-fg/[0.06]'}`}
                  >
                    {t('langZh')}
                  </button>
                  <button
                    type='button'
                    disabled={locale === 'en'}
                    onClick={() => {
                      if (locale !== 'en') router.replace(pathname, { locale: 'en' });
                      setLangOpen(false);
                    }}
                    className={`rounded-lg px-3 py-2 text-left text-sm ${locale === 'en' ? 'bg-fg/10 font-medium text-fg/90' : 'text-fg/65 hover:bg-fg/[0.06]'}`}
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
                toggleAppTheme(origin ?? { x: e.clientX, y: e.clientY });
              }}
              aria-label={themeNavHint}
              className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-fg/14 bg-fg/[0.06] text-fg/85 transition-colors duration-200 hover:bg-fg/10 ${focusRing}`}
            >
              {appTheme === 'dark' ? <IconSun className='text-[15px]' /> : <IconMoon className='text-[15px]' />}
            </button>
            <GithubAuthButton />
            <QqAuthButton />
          </div>
        </div>
      </header>

      <aside className='fixed left-0 top-0 z-[2] hidden h-[100vh] w-1/2 overflow-hidden border-r border-fg/[0.08] bg-[rgb(var(--surface-fg-rgb)/0.02)] xl:block'>
        <TemplateMasonry reduceMotion={reduceMotion} />
      </aside>

      <div className='relative isolate z-[1] min-h-screen w-full xl:ml-auto xl:w-1/2'>
        <HomeRightBackdrop />
        <div className='relative z-[1]'>
        <section className='space-y-6 px-5 pb-10 pt-[calc(5rem+env(safe-area-inset-top,0px)+1.25rem)] sm:px-8 lg:px-10'>
          <div data-home-neo-reveal className='space-y-6'>
            <p className='inline-flex rounded-full border border-fg/12 bg-fg/[0.03] px-3 py-1 text-[11px] tracking-[0.14em] text-fg/66'>
              {t('heroBadge')}
            </p>
            <HeroTypingTitle
              reduceMotion={reduceMotion}
              lines={heroLines}
              className='max-w-[28ch] text-left text-[clamp(2.2rem,4.8vw+0.8rem,4.2rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-fg/96'
            />
            <p className='max-w-[54ch] text-[15px] leading-7 text-fg/60 md:text-[17px]'>{t('heroSub')}</p>
            <div className='flex flex-wrap items-center gap-3'>
              <span
                role='button'
                tabIndex={0}
                onClick={startEdit}
                onKeyDown={navKey(startEdit)}
                className={`inline-flex h-12 min-w-[158px] cursor-pointer items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgb(var(--surface-fg-rgb)/0.12)] ${focusRing}`}
                style={{ background: 'var(--gradient-primary)' }}
              >
                {t('ctaStart')}
              </span>
              <span
                role='button'
                tabIndex={0}
                onClick={openGh}
                onKeyDown={navKey(openGh)}
                className={`inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border border-fg/12 bg-fg/[0.04] px-4 text-sm text-fg/68 ${focusRing}`}
              >
                <IconGithub className='text-[14px]' />
                {githubStars != null ? `${githubStars.toLocaleString(locale)} stars` : t('navGhShort')}
              </span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {moduleTags.map((label) => (
                <span key={label} className='rounded-lg border border-fg/10 bg-fg/[0.03] px-2.5 py-1 text-[11px] tracking-[0.06em] text-fg/58'>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id='features' className='border-t border-fg/[0.08] px-5 py-16 sm:px-8 lg:px-10'>
          <div data-home-neo-reveal className='max-w-[54ch]'>
            <h2 className='text-2xl font-semibold tracking-tight text-fg/94'>{t('featuresTitle')}</h2>
            <p className='mt-3 text-sm leading-7 text-fg/56'>{t('featuresDesc')}</p>
          </div>
          <div className='mt-12 flex flex-col gap-16 sm:gap-20'>
            {highlights.map((block, idx) => (
              <article
                key={block.title}
                data-home-neo-reveal
                className={`grid gap-8 ${idx % 2 === 1 ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] sm:items-center' : 'sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] sm:items-center'}`}
              >
                <div className={idx % 2 === 1 ? 'sm:order-2' : ''}>
                  <p className='text-[11px] font-semibold tracking-[0.2em] text-fg/38'>{String(idx + 1).padStart(2, '0')}</p>
                  <h3 className='mt-2 text-xl font-semibold leading-snug text-fg/92'>{block.title}</h3>
                  <p className='mt-3 text-sm leading-7 text-fg/58'>{block.desc}</p>
                  <ul className='mt-5 space-y-2.5'>
                    {block.bullets.map((bullet, bulletIdx) => (
                      <li key={bullet} className='flex gap-2.5 text-sm text-fg/66'>
                        <span
                          className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${bulletIdx === 0 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-primary-gradient-start)]'}`}
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <figure className={`overflow-hidden rounded-2xl ${idx % 2 === 1 ? 'sm:order-1' : ''}`}>
                  <Image
                    src={
                      appTheme === 'dark'
                        ? PHOTOS[`photo${idx + 1}Dark` as 'photo1Dark' | 'photo2Dark']
                        : PHOTOS[`photo${idx + 1}Light` as 'photo1Light' | 'photo2Light']
                    }
                    alt={block.title}
                    width={PHOTO_SIZES[`photo${idx + 1}` as 'photo1' | 'photo2'].width}
                    height={PHOTO_SIZES[`photo${idx + 1}` as 'photo1' | 'photo2'].height}
                    className='h-auto w-full object-cover shadow-[0_18px_48px_rgb(var(--surface-fg-rgb)/0.12)] ring-1 ring-fg/10'
                    sizes='(max-width: 1280px) 100vw, 25vw'
                    loading='lazy'
                  />
                </figure>
              </article>
            ))}
          </div>
        </section>

        <section className='border-t border-fg/[0.08] px-5 py-14 sm:px-8 lg:px-10'>
          <div data-home-neo-reveal className='max-w-[54ch]'>
            <h2 className='text-2xl font-semibold tracking-tight text-fg/94'>{t('faqTitle')}</h2>
            <p className='mt-2 text-sm leading-7 text-fg/56'>{t('faqDesc')}</p>
          </div>
          <div className='mt-8 space-y-3'>
            {faq.map((item, idx) => (
              <details key={item.q} data-home-neo-reveal className='group rounded-xl border border-fg/12 bg-[var(--editor-shell-panel)] px-5 py-4 open:border-fg/16'>
                <summary className={`flex cursor-pointer list-none items-start gap-3 marker:hidden [&::-webkit-details-marker]:hidden ${focusRing}`}>
                  <span className='mt-0.5 text-[11px] tracking-[0.16em] text-fg/38'>{String(idx + 1).padStart(2, '0')}</span>
                  <span className='min-w-0 flex-1 text-[15px] font-medium leading-snug text-fg/90'>{item.q}</span>
                  <IconDown className='mt-0.5 shrink-0 text-[11px] text-fg/38 transition-transform group-open:rotate-180' />
                </summary>
                <p className='mt-4 border-t border-fg/[0.06] pt-4 pl-[1.9rem] text-sm leading-relaxed text-fg/58'>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className='px-5 pb-14 pt-4 sm:px-8 lg:px-10'>
          <div
            data-home-neo-reveal
            className='overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--editor-shell-border))] px-6 py-10'
            style={{ background: 'var(--gradient-primary)' }}
          >
            <h2 className='text-xl font-semibold text-white'>{t('closingTitle')}</h2>
            <p className='mt-3 max-w-[48ch] text-sm leading-7 text-white/85'>{t('closingDesc')}</p>
            <span
              role='button'
              tabIndex={0}
              onClick={startEdit}
              onKeyDown={navKey(startEdit)}
              className={`mt-6 inline-flex h-11 min-w-[148px] cursor-pointer items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-[rgb(30_26_33/0.92)] shadow-[0_12px_28px_rgb(0_0_0/0.14)] ${focusRing}`}
            >
              {t('closingCta')}
            </span>
          </div>
        </section>

        <footer aria-label='Site footer' className='relative z-[1] flex justify-center px-5 pb-10 pt-2 sm:px-8 lg:px-10'>
          <a
            href='https://beian.miit.gov.cn/'
            target='_blank'
            rel='noopener noreferrer'
            className={`inline-flex items-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--color-primary)_18%,var(--editor-shell-border))] bg-[var(--editor-shell-panel-soft)] px-4 py-2.5 text-[13px] no-underline ${focusRing}`}
          >
            <span aria-hidden className='h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]' />
            <span className='text-[var(--color-primary)]'>粤ICP备2026060117号</span>
          </a>
        </footer>
        </div>
      </div>
    </main>
  );
}
