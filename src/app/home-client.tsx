'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import HeroPreviewCompare from '@/components/heroPreviewCompare';
import HomeRevealScope from '@/components/homeRevealScope';
import {
  DownOutlined,
  GithubOutlined,
  GlobalOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { Popover } from 'antd';
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
import Typed from 'typed.js';
import gsap from 'gsap';

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
  }
);

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-bg)]';

const HeroTypingTitle = memo(function HeroTypingTitle({
  reduceMotion,
  lines,
}: {
  reduceMotion: boolean;
  lines: string[];
}) {
  const elRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let iv: number | undefined;
    if (reduceMotion) {
      let idx = 0;
      el.textContent = lines[0];
      iv = window.setInterval(() => {
        idx = (idx + 1) % lines.length;
        el.textContent = lines[idx];
      }, 2800);
      return () => {
        if (iv !== undefined) window.clearInterval(iv);
      };
    }
    el.textContent = '';
    const typed = new Typed(el, {
      strings: lines,
      typeSpeed: 46,
      backSpeed: 30,
      backDelay: 2280,
      startDelay: 120,
      loop: true,
      smartBackspace: false,
      showCursor: true,
      cursorChar: '|',
      autoInsertCss: true,
      contentType: 'null',
    });
    return () => {
      typed.destroy();
    };
  }, [reduceMotion, lines]);
  return (
    <h1 className='min-h-[2.2lh] max-w-full px-2 text-center text-[1.625rem] font-semibold leading-[1.2] tracking-tight text-balance text-fg/96 sm:px-0 sm:text-4xl md:min-h-[1.15lh] md:text-[clamp(2.25rem,4vw+1rem,3.75rem)]'>
      <span ref={elRef} className='inline align-top' />
    </h1>
  );
});

const MAGNETIC_STRENGTH = 0.28;

const HeroMagneticCta = memo(function HeroMagneticCta({
  reduceMotion,
  label,
  onClick,
  onKeyDown,
  focusRing,
}: {
  reduceMotion: boolean;
  label: string;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLSpanElement>) => void;
  focusRing: string;
}) {
  const zoneRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduceMotion) return;
    const zone = zoneRef.current;
    const btn = btnRef.current;
    if (!zone || !btn) return;
    const onMove = (e: MouseEvent) => {
      const rect = zone.getBoundingClientRect();
      const x = gsap.utils.mapRange(rect.left, rect.right, -rect.width / 2, rect.width / 2, e.clientX);
      const y = gsap.utils.mapRange(rect.top, rect.bottom, -rect.height / 2, rect.height / 2, e.clientY);
      gsap.to(btn, {
        x: x * MAGNETIC_STRENGTH,
        y: y * MAGNETIC_STRENGTH,
        duration: 1.5,
        ease: 'power2.out',
        overwrite: true,
      });
    };
    const onLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.15,
        ease: 'power2.out',
        overwrite: true,
      });
    };
    zone.addEventListener('mousemove', onMove);
    zone.addEventListener('mouseleave', onLeave);
    return () => {
      zone.removeEventListener('mousemove', onMove);
      zone.removeEventListener('mouseleave', onLeave);
      gsap.set(btn, { clearProps: 'transform' });
    };
  }, [reduceMotion]);
  return (
    <div ref={zoneRef} className='inline-flex p-3 -m-3'>
      <span
        ref={btnRef}
        role='button'
        tabIndex={0}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={`inline-flex h-12 min-w-[158px] cursor-pointer items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgb(var(--surface-fg-rgb)/0.12)] transition-[box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_20px_44px_rgb(var(--surface-fg-rgb)/0.14)] ${focusRing}`}
        style={{ background: 'var(--gradient-primary)', WebkitBackfaceVisibility: 'hidden' }}
      >
        {label}
      </span>
    </div>
  );
});

type HighlightBlock = {
  title: string;
  desc: string;
  bullets: [string, string];
};
export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('Home');
  const [langOpen, setLangOpen] = useState(false);
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
    () => false
  );
  const [scrolled, setScrolled] = useState(false);
  const [pointerPos, setPointerPos] = useState(() => ({
    x: typeof window === 'undefined' ? 0 : window.innerWidth / 2,
    y: typeof window === 'undefined' ? 0 : window.innerHeight / 2,
  }));
  const themeToggleOriginRef = useRef<{ x: number; y: number } | null>(null);

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
      `fixed top-0 left-0 right-0 z-50 isolate w-full bg-[var(--editor-shell-bg)]/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl transition-[background,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${scrolled
        ? 'border-b border-fg/10 shadow-[0_12px_36px_rgb(var(--surface-fg-rgb)/0.08)]'
        : 'border-b border-fg/[0.06]'
      }`,
    [scrolled]
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
  const openGh = () => window.open('https://github.com/QdabuliuQ/easy-resume', '_blank', 'noopener,noreferrer');
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
              <Popover
                arrow={false}
                trigger='click'
                open={langOpen}
                onOpenChange={setLangOpen}
                placement='bottomRight'
                styles={{ body: { padding: 8 } }}
                content={
                  <div className='flex min-w-[148px] flex-col gap-0.5'>
                    <button
                      type='button'
                      disabled={locale === 'zh'}
                      onClick={() => {
                        if (locale === 'zh') return;
                        router.replace(pathname, { locale: 'zh' });
                        setLangOpen(false);
                      }}
                      className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${locale === 'zh'
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
                      className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${locale === 'en'
                        ? 'cursor-default bg-fg/10 font-medium text-fg/90'
                        : 'cursor-pointer text-fg/65 hover:bg-fg/[0.06]'
                        }`}
                    >
                      {t('langEn')}
                    </button>
                  </div>
                }
              >
                <button
                  type='button'
                  aria-expanded={langOpen}
                  aria-haspopup='dialog'
                  aria-label={t('langSwitch')}
                  className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-fg/68 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-fg/[0.09] hover:text-fg/88 sm:w-auto sm:gap-1.5 sm:px-3 ${focusRing}`}
                >
                  <GlobalOutlined className='text-[15px]' />
                  <span className='hidden max-w-[7rem] truncate text-xs font-medium sm:inline'>
                    {locale === 'zh' ? t('langZh') : t('langEn')}
                  </span>
                </button>
              </Popover>
              <span
                role='button'
                tabIndex={0}
                aria-label={t('navGh')}
                onClick={openGh}
                onKeyDown={navKey(openGh)}
                className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-fg/68 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-fg/[0.09] hover:text-fg/88 sm:hidden ${focusRing}`}
              >
                <GithubOutlined className='text-[15px]' />
              </span>
              <span
                role='button'
                tabIndex={0}
                aria-label={t('navGh')}
                onClick={openGh}
                onKeyDown={navKey(openGh)}
                className={`hidden h-9 cursor-pointer items-center gap-1.5 rounded-full border border-fg/14 bg-fg/[0.05] px-3 text-xs font-medium text-fg/65 transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-fg/[0.09] hover:text-fg/88 sm:inline-flex ${focusRing}`}
              >
                <GithubOutlined className='text-[14px]' />
                GitHub
              </span>
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
                  <SunOutlined className='text-[15px]' />
                ) : (
                  <MoonOutlined className='text-[15px]' />
                )}
              </button>
              <span
                role='button'
                tabIndex={0}
                onClick={pushPath('/edit')}
                onKeyDown={navKey(pushPath('/edit'))}
                className={`inline-flex h-9 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-full border border-fg/14 bg-fg/[0.07] px-3 text-xs font-medium text-fg/58 transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:bg-fg/11 hover:text-fg/78 motion-reduce:hover:translate-y-0 active:translate-y-0 sm:px-4 sm:text-sm ${focusRing}`}
              >
                {t('navStart')}
              </span>
            </div>
          </div>
      </header>

      <div className='relative z-[1]'>
        <section className='relative mx-auto min-h-[88vh] w-full max-w-6xl items-center px-5 pb-10 pt-[calc(3.5rem+env(safe-area-inset-top,0px)+1.25rem)] md:min-h-[90vh] md:pb-24 md:pt-32'>
          <div className='w-full flex items-center justify-center mb-[100px]'>
            <div className='flex flex-col items-center justify-center'>
              <p
                className='inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] tracking-[0.14em] mb-[20px]'
                style={{
                  border: '1px solid color-mix(in srgb, var(--color-primary-gradient-start) 34%, transparent)',
                  background: 'color-mix(in srgb, var(--color-primary-gradient-start) 12%, transparent)',
                  color: 'color-mix(in srgb, var(--color-primary-gradient-start) 52%, var(--text-strong))',
                }}
              >
                {t('heroBadge')}
              </p>
              <HeroTypingTitle reduceMotion={reduceMotion} lines={heroLines} />
              <p className='max-w-[62ch] text-base leading-[1.75] text-fg/58 md:text-[17px] text-center mt-[15px]'>
                {t('heroSub')}
              </p>
              <div className='mt-[15px]'>
                <HeroMagneticCta
                  reduceMotion={reduceMotion}
                  label={t('ctaStart')}
                  onClick={pushPath('/edit')}
                  onKeyDown={navKey(pushPath('/edit'))}
                  focusRing={focusRing}
                />
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
              <p className='mt-3 text-sm leading-7 text-fg/56 md:text-[15px]'>
                {t('featuresDesc')}
              </p>
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
                    <h3 className='mt-2 text-xl font-semibold text-fg/92 md:text-2xl'>{block.title}</h3>
                    <p className='mt-3 max-w-[54ch] text-sm leading-7 text-fg/58 md:text-[15px]'>{block.desc}</p>
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
                      src={appTheme === 'dark' ? PHOTOS[`photo${idx + 1}Dark`] : PHOTOS[`photo${idx + 1}Light`]}
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
                  <p className='mt-2 text-sm leading-7 text-fg/58 md:text-[15px]'>
                    {t('moduleDesc')}
                  </p>
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
              <h2 className='text-2xl font-semibold tracking-tight text-fg/94 md:text-[1.75rem]'>{t('faqTitle')}</h2>
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
                    <DownOutlined className='mt-0.5 shrink-0 text-[11px] text-fg/38 group-open:rotate-180' />
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
              onClick={pushPath('/edit')}
              onKeyDown={navKey(pushPath('/edit'))}
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
