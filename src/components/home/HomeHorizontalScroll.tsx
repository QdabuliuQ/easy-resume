'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { memo, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { PHOTOS, PHOTO_SIZES } from '@/lib/brandAssets';
import { prefetchEditPage } from '@/lib/prefetchEditPage';
import { homeFocusRing, homeNavKey } from '@/lib/home/homeA11y';
import { setPhysicsPause } from '@/lib/home/physicsPauseStore';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';

const FIRST_SCREEN_PROGRESS = 0.05;
/** ponytail: snap max 0.22s + scrub settle buffer */
const SCROLL_SCRUB_SETTLE_MS = 280;

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HeroTypingTitle = dynamic(() => import('@/components/home/HeroTypingTitle'), {
  ssr: false,
});

const TemplatePhysicsDrop = dynamic(() => import('@/components/home/TemplatePhysicsDrop'), {
  ssr: false,
  loading: () => <div className='home-physics' aria-hidden />,
});

function HomePhysicsLayer({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className='home-physics'>
      <TemplatePhysicsDrop reduceMotion={reduceMotion} />
    </div>
  );
}

const panelBase = 'home-panel flex h-screen w-[100vw] min-w-[100vw] max-w-[100vw] shrink-0 grow-0';

const heroPanelShell = `${panelBase} flex flex-col justify-start`;

const heroTextShell =
  'relative z-[1] w-full px-5 pb-3 pt-[calc(4.5rem+env(safe-area-inset-top,0px))] text-center sm:px-8 sm:pt-[calc(5rem+env(safe-area-inset-top,0px))] lg:px-10';

const contentPanelShell = `${panelBase} flex-col justify-center overflow-hidden px-5 py-8 sm:px-8 lg:px-10`;

const homeGlassShell =
  'ai-tools-glass pointer-events-auto mx-auto w-full max-w-[min(92vw,780px)] rounded-3xl p-6 shadow-[0_20px_56px_rgb(var(--surface-fg-rgb)/0.08)] sm:p-8';

const highlightFigureCls =
  'mx-auto w-full max-w-[220px] shrink-0 overflow-hidden rounded-2xl sm:mx-0 sm:max-w-[248px]';

const highlightImageCls =
  'h-auto w-full object-cover shadow-[0_18px_48px_rgb(var(--surface-fg-rgb)/0.12)] ring-1 ring-fg/10';

type HighlightBlock = {
  title: string;
  desc: string;
  bullets: [string, string];
};

type Props = {
  reduceMotion: boolean;
  githubStars: number | null;
};

const IconGithub = memo(function IconGithub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox='0 0 16 16' width='1em' height='1em' fill='currentColor' aria-hidden>
      <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z' />
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

function HighlightArticle({
  block,
  idx,
  appTheme,
  onImageLoad,
  compact = false,
}: {
  block: HighlightBlock;
  idx: number;
  appTheme: 'dark' | 'light';
  onImageLoad?: () => void;
  compact?: boolean;
}) {
  const photoKey = appTheme === 'dark' ? (`photo${idx + 1}Dark` as const) : (`photo${idx + 1}Light` as const);
  const sizeKey = `photo${idx + 1}` as 'photo1' | 'photo2';
  if (compact) {
    const imageLeft = idx === 0;
    const textBlock = (
      <div className='min-w-0'>
        <p className='text-[11px] font-semibold tracking-[0.2em] text-fg/38'>{String(idx + 1).padStart(2, '0')}</p>
        <h3 className='mt-2 text-lg font-semibold leading-snug text-fg/92 sm:text-xl'>{block.title}</h3>
        <p className='mt-2 text-sm leading-6 text-fg/58'>{block.desc}</p>
        <ul className='mt-4 space-y-2'>
          {block.bullets.map((bullet, bulletIdx) => (
            <li key={bullet} className='flex gap-2 text-sm text-fg/66'>
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${bulletIdx === 0 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-primary-gradient-start)]'}`}
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    );
    const figureBlock = (
      <figure className={highlightFigureCls}>
        <Image
          src={PHOTOS[photoKey]}
          alt={block.title}
          width={PHOTO_SIZES[sizeKey].width}
          height={PHOTO_SIZES[sizeKey].height}
          className={highlightImageCls}
          sizes='(max-width: 1280px) 32vw, 248px'
          loading='lazy'
          onLoad={onImageLoad}
        />
      </figure>
    );
    return (
      <article
        className={`grid items-center gap-5 sm:gap-8 ${imageLeft ? 'sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)]' : 'sm:grid-cols-[minmax(0,1fr)_minmax(0,auto)]'}`}
      >
        {imageLeft ? (
          <>
            {figureBlock}
            {textBlock}
          </>
        ) : (
          <>
            {textBlock}
            {figureBlock}
          </>
        )}
      </article>
    );
  }
  return (
    <article className='grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,auto)] sm:gap-8'>
      <div>
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
      <figure className={highlightFigureCls}>
        <Image
          src={PHOTOS[photoKey]}
          alt={block.title}
          width={PHOTO_SIZES[sizeKey].width}
          height={PHOTO_SIZES[sizeKey].height}
          className={highlightImageCls}
          sizes='(max-width: 1280px) 32vw, 248px'
          loading='lazy'
          onLoad={onImageLoad}
        />
      </figure>
    </article>
  );
}

function HeroPanelContent({
  reduceMotion,
  heroLines,
  githubStars,
  locale,
  startEdit,
  prefetchEdit,
  navKey,
  openGh,
}: {
  reduceMotion: boolean;
  heroLines: string[];
  githubStars: number | null;
  locale: string;
  startEdit: () => void;
  prefetchEdit: () => void;
  navKey: (fn: () => void) => (e: KeyboardEvent<HTMLSpanElement>) => void;
  openGh: () => void;
}) {
  const t = useTranslations('Home');
  return (
    <>
      <div data-home-enter data-home-interactive>
        <HeroTypingTitle
          reduceMotion={reduceMotion}
          lines={heroLines}
          className='select-text min-h-[2.2lh] text-center text-[clamp(2rem,4.8vw+0.75rem,3.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-balance text-fg/96 md:min-h-[1.15lh] md:text-[clamp(2.25rem,5vw+0.5rem,4.25rem)]'
        />
      </div>
      <p
        data-home-enter
        className='mx-auto mt-4 max-w-[54ch] text-center text-[15px] leading-7 text-fg/60 md:text-[17px]'
      >
        {t('heroSub')}
      </p>
      <div className='mt-5 flex flex-wrap items-center justify-center gap-3' data-home-enter data-home-interactive>
        <span
          role='button'
          tabIndex={0}
          onClick={startEdit}
          onKeyDown={navKey(startEdit)}
          onPointerEnter={prefetchEdit}
          onFocus={prefetchEdit}
          className={`group relative inline-flex h-12 min-w-[158px] cursor-pointer items-center justify-center overflow-hidden rounded-xl px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgb(var(--surface-fg-rgb)/0.12)] transition-[transform,box-shadow,filter] duration-200 ease-out hover:brightness-110 hover:shadow-[0_20px_48px_color-mix(in_srgb,var(--color-primary)_28%,transparent),0_16px_40px_rgb(var(--surface-fg-rgb)/0.14)] active:scale-[0.98] active:brightness-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${homeFocusRing}`}
          style={{ background: 'var(--gradient-primary)' }}
        >
          <span
            aria-hidden
            className='pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full motion-reduce:hidden'
          />
          {t('ctaStart')}
        </span>
        <span
          role='button'
          tabIndex={0}
          onClick={openGh}
          onKeyDown={navKey(openGh)}
          className={`group inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-xl border border-fg/20 bg-[color-mix(in_srgb,var(--editor-shell-panel-strong)_92%,transparent)] px-4 text-sm font-medium text-fg/88 shadow-[0_12px_32px_rgb(var(--surface-fg-rgb)/0.22)] backdrop-blur-md transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:border-fg/28 hover:bg-[color-mix(in_srgb,var(--editor-shell-panel-strong)_98%,transparent)] hover:text-fg hover:shadow-[0_16px_40px_rgb(var(--surface-fg-rgb)/0.28)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${homeFocusRing}`}
        >
          <IconGithub className='text-[14px] transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100' />
          {githubStars != null ? `${githubStars.toLocaleString(locale)} stars` : t('navGhShort')}
        </span>
      </div>
    </>
  );
}

function FaqClosingPanel({
  faq,
  startEdit,
  prefetchEdit,
  navKey,
}: {
  faq: { q: string; a: string }[];
  startEdit: () => void;
  prefetchEdit: () => void;
  navKey: (fn: () => void) => (e: KeyboardEvent<HTMLSpanElement>) => void;
}) {
  const t = useTranslations('Home');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <>
      <div className='max-w-[54ch]'>
        <h2 className='text-2xl font-semibold tracking-tight text-fg/94'>{t('faqTitle')}</h2>
        <p className='mt-3 text-sm leading-7 text-fg/56'>{t('faqDesc')}</p>
      </div>
      <div className='mt-6 max-h-[min(36vh,320px)] overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]'>
        <div className='divide-y divide-fg/[0.08] border-y border-fg/[0.08]'>
          {faq.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <div
                key={item.q}
                data-home-interactive
                className={`px-1 py-0.5 transition-colors sm:px-2${open ? ' bg-fg/[0.03]' : ''}`}
              >
                <button
                  type='button'
                  aria-expanded={open}
                  onClick={() => setOpenIdx(open ? null : idx)}
                  className={`flex w-full cursor-pointer list-none items-center gap-3 py-3.5 text-left ${homeFocusRing}`}
                >
                  <span className='min-w-0 flex-1 text-[14px] font-semibold leading-snug text-fg/96 sm:text-[15px]'>
                    {item.q}
                  </span>
                  <span
                    className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-fg/10 bg-fg/[0.04] text-fg/50 transition-transform duration-200${open ? ' rotate-180' : ''}`}
                  >
                    <IconDown className='text-[11px]' />
                  </span>
                </button>
                {open ? <p className='pb-4 pr-10 text-sm leading-relaxed text-fg/58'>{item.a}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className='mt-8 border-t border-fg/[0.08] pt-8'>
        <div className='rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--editor-shell-border))] bg-[color-mix(in_srgb,var(--color-primary)_7%,var(--editor-shell-panel-strong))] px-5 py-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)] sm:px-6 sm:py-7'>
          <h2 className='text-lg font-semibold tracking-tight text-fg/94 sm:text-xl'>{t('closingTitle')}</h2>
          <p className='mt-2 max-w-full text-sm leading-7 text-fg/58 sm:text-[15px]'>{t('closingDesc')}</p>
          <span
            role='button'
            tabIndex={0}
            data-home-interactive
            onClick={startEdit}
            onKeyDown={navKey(startEdit)}
            onPointerEnter={prefetchEdit}
            onFocus={prefetchEdit}
            className={`mt-5 inline-flex h-11 min-w-[148px] cursor-pointer items-center justify-center rounded-xl px-8 text-sm font-semibold text-white shadow-[0_12px_28px_color-mix(in_srgb,var(--color-primary)_24%,transparent)] transition-[transform,filter] duration-200 ease-out hover:brightness-110 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${homeFocusRing}`}
            style={{ background: 'var(--gradient-primary)' }}
          >
            {t('closingCta')}
          </span>
        </div>
        <footer aria-label='Site footer' className='mt-6 flex justify-center'>
          <a
            href='https://beian.miit.gov.cn/'
            target='_blank'
            rel='noopener noreferrer'
            data-home-interactive
            className={`text-[13px] !text-fg/92 no-underline transition-colors hover:!text-fg/96 ${homeFocusRing}`}
          >
            粤ICP备2026060117号
          </a>
        </footer>
      </div>
    </>
  );
}

function ContentPanels({
  highlights,
  faq,
  appTheme,
  startEdit,
  prefetchEdit,
  onImageLoad,
}: {
  highlights: HighlightBlock[];
  faq: { q: string; a: string }[];
  appTheme: 'dark' | 'light';
  startEdit: () => void;
  prefetchEdit: () => void;
  onImageLoad?: () => void;
}) {
  const t = useTranslations('Home');
  return (
    <>
      <div className={contentPanelShell}>
        <div className='mx-auto flex h-full w-full items-center justify-center px-0 py-4'>
          <div className={homeGlassShell}>
            <div className='max-w-[54ch]'>
              <h2 className='text-2xl font-semibold tracking-tight text-fg/94'>{t('featuresTitle')}</h2>
              <p className='mt-3 text-sm leading-7 text-fg/56'>{t('featuresDesc')}</p>
            </div>
            <div className='mt-6 flex flex-col gap-8 sm:mt-8 sm:gap-10'>
              <HighlightArticle block={highlights[0]!} idx={0} appTheme={appTheme} onImageLoad={onImageLoad} compact />
              <HighlightArticle block={highlights[1]!} idx={1} appTheme={appTheme} onImageLoad={onImageLoad} compact />
            </div>
          </div>
        </div>
      </div>
      <div className={contentPanelShell}>
        <div className='mx-auto flex h-full w-full items-center justify-center px-0 py-4'>
          <div className={homeGlassShell}>
            <FaqClosingPanel faq={faq} startEdit={startEdit} prefetchEdit={prefetchEdit} navKey={homeNavKey} />
          </div>
        </div>
      </div>
    </>
  );
}

function VerticalFallback({
  hero,
  highlights,
  faq,
  startEdit,
  prefetchEdit,
}: {
  hero: ReactNode;
  highlights: HighlightBlock[];
  faq: { q: string; a: string }[];
  startEdit: () => void;
  prefetchEdit: () => void;
}) {
  const t = useTranslations('Home');
  const appTheme = useResolvedTheme();
  return (
    <div className='relative z-10'>
      <section className='flex min-h-screen flex-col'>{hero}</section>
      <div className='border-t border-fg/[0.08]'>
        <section id='features' className='px-5 py-16 sm:px-8 lg:px-10'>
          <div className={`${homeGlassShell}`}>
            <div className='max-w-[54ch]'>
              <h2 className='text-2xl font-semibold tracking-tight text-fg/94'>{t('featuresTitle')}</h2>
              <p className='mt-3 text-sm leading-7 text-fg/56'>{t('featuresDesc')}</p>
            </div>
            <div className='mt-10 flex flex-col gap-14 sm:mt-12 sm:gap-16'>
              {highlights.map((block, idx) => (
                <HighlightArticle key={block.title} block={block} idx={idx} appTheme={appTheme} />
              ))}
            </div>
          </div>
        </section>
        <section className='border-t border-fg/[0.08] px-5 py-14 sm:px-8 lg:px-10'>
          <div className={homeGlassShell}>
            <FaqClosingPanel faq={faq} startEdit={startEdit} prefetchEdit={prefetchEdit} navKey={homeNavKey} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default function HomeHorizontalScroll({ reduceMotion, githubStars }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('Home');
  const appTheme = useResolvedTheme();
  const heroLines = t.raw('heroLines') as string[];
  const highlights = t.raw('highlights') as HighlightBlock[];
  const faq = t.raw('faq') as { q: string; a: string }[];

  const openGh = () =>
    window.open('https://github.com/QdabuliuQ/easy-resume', '_blank', 'noopener,noreferrer');
  const prefetchEdit = () => {
    router.prefetch('/edit');
    prefetchEditPage();
  };
  const startEdit = () => router.push('/edit');
  const refreshScroll = () => ScrollTrigger.refresh();

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 160);
    return () => window.clearTimeout(id);
  }, [reduceMotion]);

  const heroContent = (
    <div className={heroPanelShell}>
      <div className={heroTextShell}>
        <div className='mx-auto w-full max-w-5xl'>
          <HeroPanelContent
            reduceMotion={reduceMotion}
            heroLines={heroLines}
            githubStars={githubStars}
            locale={locale}
            startEdit={startEdit}
            prefetchEdit={prefetchEdit}
            navKey={homeNavKey}
            openGh={openGh}
          />
        </div>
      </div>
    </div>
  );

  useGSAP(
    () => {
      if (reduceMotion) return;
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;
      const getPanelCount = () => track.children.length;
      const getSnapStep = () => {
        const count = getPanelCount();
        return count > 1 ? 1 / (count - 1) : 1;
      };
      const getScrollDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      let scrubSettleTimer: ReturnType<typeof setTimeout> | undefined;
      gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          pin: true,
          scrub: 0.55,
          snap: {
            snapTo: (progress) => gsap.utils.snap(getSnapStep(), progress),
            duration: { min: 0.08, max: 0.22 },
            delay: 0.02,
            ease: 'power2.out',
          },
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            setPhysicsPause('offScreen', self.progress >= FIRST_SCREEN_PROGRESS);
            setPhysicsPause('scrubbing', true);
            if (scrubSettleTimer) clearTimeout(scrubSettleTimer);
            scrubSettleTimer = setTimeout(() => {
              setPhysicsPause('scrubbing', false);
              scrubSettleTimer = undefined;
            }, SCROLL_SCRUB_SETTLE_MS);
          },
        },
      });
      return () => {
        if (scrubSettleTimer) clearTimeout(scrubSettleTimer);
        setPhysicsPause('offScreen', false);
        setPhysicsPause('scrubbing', false);
      };
    },
    { scope: sectionRef, dependencies: [reduceMotion], revertOnUpdate: true },
  );

  if (reduceMotion) {
    return (
      <>
        <HomePhysicsLayer reduceMotion={reduceMotion} />
        <VerticalFallback
          hero={heroContent}
          highlights={highlights}
          faq={faq}
          startEdit={startEdit}
          prefetchEdit={prefetchEdit}
        />
      </>
    );
  }

  return (
    <section ref={sectionRef} className='home-scroll relative z-10 h-screen w-full overflow-hidden'>
      <HomePhysicsLayer reduceMotion={reduceMotion} />
      <div ref={trackRef} className='home-track flex h-full w-max will-change-transform'>
        {heroContent}
        <ContentPanels
          highlights={highlights}
          faq={faq}
          appTheme={appTheme}
          startEdit={startEdit}
          prefetchEdit={prefetchEdit}
          onImageLoad={refreshScroll}
        />
      </div>
    </section>
  );
}
