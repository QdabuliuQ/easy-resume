'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  DownOutlined,
  GithubOutlined,
  GlobalOutlined,
  LeftOutlined,
  MoonOutlined,
  RightOutlined,
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
  type PointerEvent,
} from 'react';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeAppTheme,
  toggleAppTheme,
} from '@/lib/themeStore';
import Typed from 'typed.js';

const HomeResumeTemplateMarquee = dynamic(
  () => import('@/components/homeResumeTemplateMarquee'),
  {
    ssr: false,
    loading: () => (
      <div
        className='relative min-h-[200px] w-full border-y border-fg/10 bg-[rgb(var(--surface-fg-rgb)/0.03)] py-6 md:min-h-[220px]'
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

function HeroPreviewCompare({
  reduceMotion,
  onDragStateChange,
  compareFigure,
  compareSlider,
  previewLightAlt,
  previewDarkAlt,
}: {
  reduceMotion: boolean;
  onDragStateChange?: (dragging: boolean) => void;
  compareFigure: string;
  compareSlider: string;
  previewLightAlt: string;
  previewDarkAlt: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef(50);
  const pendingXRef = useRef<number | null>(null);
  const wrapGeomRef = useRef({ left: 0, width: 0 });
  const snapRafRef = useRef<number | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const [pct, setPct] = useState(50);
  const cancelSnap = () => {
    if (snapRafRef.current != null) {
      cancelAnimationFrame(snapRafRef.current);
      snapRafRef.current = null;
    }
  };
  const cancelDragRaf = () => {
    if (dragRafRef.current != null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
  };
  const refreshWrapGeom = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    wrapGeomRef.current = { left: r.left, width: r.width };
  };
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => refreshWrapGeom());
    ro.observe(el);
    refreshWrapGeom();
    return () => ro.disconnect();
  }, []);
  useEffect(
    () => () => {
      onDragStateChange?.(false);
      cancelSnap();
      cancelDragRaf();
    },
    [onDragStateChange]
  );
  const syncPctVisual = (p: number) => {
    pctRef.current = p;
    const clamped = Math.min(100, Math.max(0, p));
    const pp = `${clamped.toFixed(3)}%`;
    const fr = Math.max(clamped / 100, 0.001);
    wrapRef.current?.style.setProperty('--compare-pct', pp);
    wrapRef.current?.style.setProperty('--compare-fr', String(fr));
    handleRef.current?.setAttribute('aria-valuenow', String(Math.round(p)));
  };
  const applyClientX = (clientX: number) => {
    let { left, width: w } = wrapGeomRef.current;
    if (w <= 0) {
      refreshWrapGeom();
      ({ left, width: w } = wrapGeomRef.current);
    }
    if (w <= 0) return;
    const x = Math.min(Math.max(clientX - left, 0), w);
    syncPctVisual((x / w) * 100);
  };
  const scheduleApplyClientX = (clientX: number) => {
    pendingXRef.current = clientX;
    if (dragRafRef.current != null) return;
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      const x = pendingXRef.current;
      if (x == null) return;
      pendingXRef.current = null;
      applyClientX(x);
    });
  };
  const snapToCenter = () => {
    cancelSnap();
    const start = pctRef.current;
    if (reduceMotion || Math.abs(start - 50) < 0.35) {
      syncPctVisual(50);
      setPct(50);
      return;
    }
    const dur = 420;
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / dur);
      const eased = 1 - (1 - u) ** 3;
      syncPctVisual(start + (50 - start) * eased);
      if (u < 1) snapRafRef.current = requestAnimationFrame(tick);
      else {
        snapRafRef.current = null;
        syncPctVisual(50);
        setPct(50);
      }
    };
    snapRafRef.current = requestAnimationFrame(tick);
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    cancelSnap();
    cancelDragRaf();
    draggingRef.current = true;
    onDragStateChange?.(true);
    refreshWrapGeom();
    wrapRef.current?.setPointerCapture(e.pointerId);
    applyClientX(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!wrapRef.current?.hasPointerCapture(e.pointerId)) return;
    scheduleApplyClientX(e.clientX);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    cancelDragRaf();
    pendingXRef.current = null;
    applyClientX(e.clientX);
    draggingRef.current = false;
    onDragStateChange?.(false);
    setPct(pctRef.current);
    try {
      wrapRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    snapToCenter();
  };
  const onHandleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 3;
      setPct((p) => {
        const n = e.key === 'ArrowLeft' ? p - step : p + step;
        return Math.min(100, Math.max(0, n));
      });
    }
    if (e.key === 'Home') {
      e.preventDefault();
      setPct(0);
    }
    if (e.key === 'End') {
      e.preventDefault();
      setPct(100);
    }
  };
  return (
    <figure className='mx-auto w-[80vw] max-w-[min(900px,92vw)]' aria-label={compareFigure}>
      <div
        ref={wrapRef}
        className='relative w-full touch-none overflow-hidden rounded-2xl border border-white/[0.09] bg-[rgb(22_20_24)] shadow-[0_28px_80px_rgb(0_0_0/0.45)] ring-1 ring-white/[0.04]'
        style={{
          ['--compare-pct' as string]: `${pct.toFixed(3)}%`,
          ['--compare-fr' as string]: String(Math.max(pct / 100, 0.001)),
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={() => {
          if (!draggingRef.current) return;
          draggingRef.current = false;
          onDragStateChange?.(false);
          setPct(pctRef.current);
          snapToCenter();
        }}
      >
        <Image
          src='/preview_light.png'
          alt={previewLightAlt}
          width={1920}
          height={999}
          sizes='(max-width:1024px) 80vw, 900px'
          className='pointer-events-none block h-auto w-full select-none'
          draggable={false}
        />
        <div className='pointer-events-none absolute inset-0'>
          <div
            className='absolute inset-0 overflow-hidden'
            style={{
              transformOrigin: 'left center',
              transform: 'scaleX(var(--compare-fr, 0.5))',
              willChange: 'transform',
            }}
          >
            <div
              className='absolute inset-0'
              style={{
                transformOrigin: 'left center',
                transform: 'scaleX(calc(1 / max(var(--compare-fr, 0.5), 0.001)))',
                willChange: 'transform',
              }}
            >
              <Image
                src='/preview.png'
                alt={previewDarkAlt}
                fill
                sizes='(max-width:1024px) 80vw, 900px'
                className='pointer-events-none select-none object-cover object-left-top'
                priority
                draggable={false}
              />
            </div>
          </div>
        </div>
        <div
          ref={handleRef}
          role='slider'
          tabIndex={0}
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={compareSlider}
          aria-orientation='horizontal'
          onKeyDown={onHandleKey}
          className={`group absolute inset-y-0 z-10 flex w-10 -translate-x-1/2 cursor-ew-resize flex-col items-center outline-none ${focusRing}`}
          style={{ left: 'var(--compare-pct, 50%)' }}
        >
          <div className='relative my-1 flex min-h-0 w-full flex-1 flex-col items-center justify-center py-1'>
            <div className='flex h-full min-h-[100px] w-full flex-row items-center justify-center gap-0.5'>
              <LeftOutlined
                aria-hidden
                className='pointer-events-none shrink-0 text-[11px] [&_svg]:!fill-[var(--color-primary-gradient-start)] drop-shadow-[0_1px_2px_rgb(0_0_0/0.4)]'
              />
              <span
                aria-hidden
                className='h-full min-h-[100px] w-[4px] max-w-[8px] shrink-0 rounded-full bg-gradient-to-b from-[var(--color-primary-gradient-start)] to-[var(--color-primary)] transition-[width] duration-200 ease-out group-hover:w-[6px] group-focus-visible:w-[6px]'
              />
              <RightOutlined
                aria-hidden
                className='pointer-events-none shrink-0 text-[11px] [&_svg]:!fill-[var(--color-primary)] drop-shadow-[0_1px_2px_rgb(0_0_0/0.4)]'
              />
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

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
  const [themePref, appTheme] = themeSnap.split('|') as ['dark' | 'light' | 'system', 'dark' | 'light'];
  const themeNavHint =
    themePref === 'dark' ? t('themeToLight') : themePref === 'light' ? t('themeToSystem') : t('themeToDark');
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
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [finePointer, setFinePointer] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setReveal((prev) => {
          const next = { ...prev };
          for (const entry of entries) {
            const key = (entry.target as HTMLElement).dataset.reveal;
            if (!key) continue;
            if (entry.isIntersecting) next[key] = true;
          }
          return next;
        });
      },
      { threshold: 0, rootMargin: '0px 0px 120px 0px' }
    );

    const nodes = document.querySelectorAll<HTMLElement>('[data-reveal]');
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)');
    const onMediaChange = (event: MediaQueryListEvent) => setFinePointer(event.matches);
    setFinePointer(media.matches);
    media.addEventListener('change', onMediaChange);
    return () => media.removeEventListener('change', onMediaChange);
  }, []);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    if (!finePointer || isComparing) {
      glow.style.transform = 'translate3d(calc(50vw - 240px), calc(40vh - 240px), 0)';
      glow.style.opacity = isComparing ? '0.28' : '0.52';
      return;
    }
    glow.style.opacity = '0.72';

    const flush = () => {
      rafRef.current = null;
      const { x, y } = mouseTargetRef.current;
      glow.style.transform = `translate3d(${x - 240}px, ${y - 240}px, 0)`;
    };

    const onMouseMove = (event: MouseEvent) => {
      mouseTargetRef.current = { x: event.clientX, y: event.clientY };
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(flush);
    };

    const onMouseLeave = () => {
      mouseTargetRef.current = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(flush);
    };

    onMouseLeave();
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseout', onMouseLeave, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseout', onMouseLeave);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [finePointer, isComparing]);

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

  const revealClass = (key: string) =>
    reduceMotion || reveal[key]
      ? 'translate-y-0 opacity-100'
      : 'translate-y-5 opacity-0';

  const transitionReveal = reduceMotion
    ? ''
    : 'transition-[opacity,transform] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)]';
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
  const toFeatures = () =>
    document.getElementById('features')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });

  return (
    <main className='relative min-h-screen bg-[var(--editor-shell-bg)] text-[var(--text-strong)]'>
      <div className='pointer-events-none absolute inset-0 z-0 overflow-hidden'>
        <div
          ref={glowRef}
          className='fixed left-0 top-0 h-[480px] w-[480px] rounded-full blur-[90px] transition-opacity duration-500 will-change-transform'
          style={{
            opacity: finePointer ? 0.72 : 0.52,
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 24%, transparent), color-mix(in srgb, var(--color-primary-gradient-start) 18%, transparent) 44%, transparent 74%)',
          }}
        />
        <div
          className='absolute -top-28 left-[-10%] h-[360px] w-[360px] rounded-full blur-2xl'
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 28%, transparent), transparent 72%)',
          }}
        />
        <div
          className='absolute top-[18%] right-[-6%] h-[340px] w-[340px] rounded-full blur-2xl'
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary-gradient-start) 26%, transparent), transparent 70%)',
          }}
        />
        <div
          className='absolute bottom-[12%] left-[35%] h-[260px] w-[260px] rounded-full blur-2xl'
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 68%)',
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
              <span className='relative inline-flex h-8 w-8 shrink-0'>
                <Image src='/logo.png' alt={t('logoAlt')} fill sizes='32px' className='object-contain p-0.5' />
              </span>
              <span className='truncate text-sm font-semibold tracking-[0.12em] text-fg/90'>{t('brandName')}</span>
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
                onClick={toggleAppTheme}
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
              <div className='flex flex-wrap items-center gap-3 mt-[15px]'>
                <span
                  role='button'
                  tabIndex={0}
                  onClick={pushPath('/edit')}
                  onKeyDown={navKey(pushPath('/edit'))}
                  className={`inline-flex h-12 min-w-[158px] translate-y-0 cursor-pointer items-center justify-center rounded-xl px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgb(var(--surface-fg-rgb)/0.12)] transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[2px] hover:shadow-[0_20px_44px_rgb(var(--surface-fg-rgb)/0.14)] motion-reduce:hover:translate-y-0 active:translate-y-0 ${focusRing}`}
                  style={{ background: 'var(--gradient-primary)', WebkitBackfaceVisibility: 'hidden' }}
                >
                  {t('ctaStart')}
                </span>
                <span
                  role='button'
                  tabIndex={0}
                  onClick={toFeatures}
                  onKeyDown={navKey(toFeatures)}
                  className={`inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-fg/16 bg-fg/[0.04] px-5 text-sm font-medium text-fg/72 transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:bg-fg/[0.07] hover:text-fg/88 motion-reduce:hover:translate-y-0 active:translate-y-0 ${focusRing}`}
                >
                  {t('ctaFeatures')}
                </span>
              </div>
            </div>
          </div>

          <HeroPreviewCompare
            reduceMotion={reduceMotion}
            onDragStateChange={setIsComparing}
            compareFigure={t('compareFigure')}
            compareSlider={t('compareSlider')}
            previewLightAlt={t('previewLightAlt')}
            previewDarkAlt={t('previewDarkAlt')}
          />

        </section>

        <div className='relative mt-5 w-full overflow-x-hidden md:mt-14'>
          <HomeResumeTemplateMarquee reduceMotion={reduceMotion} />
        </div>

        <section
          id='features'
          className='scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] border-t border-fg/[0.07] md:scroll-mt-[72px]'
        >
          <div className='mx-auto max-w-6xl px-5 py-16 md:py-20'>
            <div
              data-reveal='features-title'
              className={`max-w-[52ch] ${transitionReveal} ${revealClass('features-title')}`}
            >
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
                  data-reveal={`hl-${idx}`}
                  className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${transitionReveal} ${revealClass(`hl-${idx}`)}`}
                >
                  <div className={idx === 1 ? 'lg:order-2' : ''}>
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
                  <div
                    className={`rounded-2xl border border-[var(--editor-shell-border)] bg-[var(--editor-shell-panel-strong)] p-6 shadow-[var(--editor-shell-shadow)] transition-shadow duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[0_28px_72px_rgb(var(--surface-fg-rgb)/0.12)] md:p-8 ${idx === 1 ? 'lg:order-1' : ''
                      }`}
                  >
                    <div className='flex flex-col gap-4'>
                      <div className='h-2 w-24 rounded bg-[rgb(var(--surface-fg-rgb)/0.1)]' />
                      <div className='space-y-2'>
                        <div className='h-2 w-full rounded bg-[rgb(var(--surface-fg-rgb)/0.07)]' />
                        <div className='h-2 w-[88%] rounded bg-[rgb(var(--surface-fg-rgb)/0.07)]' />
                        <div className='h-2 w-[72%] rounded bg-[rgb(var(--surface-fg-rgb)/0.07)]' />
                      </div>
                      <div className='grid grid-cols-3 gap-2 pt-2'>
                        <div className='aspect-[4/3] rounded-lg bg-[rgb(var(--surface-fg-rgb)/0.06)]' />
                        <div className='aspect-[4/3] rounded-lg bg-[rgb(var(--surface-fg-rgb)/0.06)]' />
                        <div className='aspect-[4/3] rounded-lg bg-[rgb(var(--surface-fg-rgb)/0.06)]' />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              data-reveal='module-strip'
              className={`mt-16 md:mt-20 ${transitionReveal} ${revealClass('module-strip')}`}
            >
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
            <div
              data-reveal='faq-title'
              className={`max-w-xl ${transitionReveal} ${revealClass('faq-title')}`}
            >
              <h2 className='text-2xl font-semibold tracking-tight text-fg/94 md:text-[1.75rem]'>{t('faqTitle')}</h2>
              <p className='mt-2 text-sm leading-relaxed text-fg/56'>{t('faqDesc')}</p>
            </div>
            <div className='mt-10 grid items-start gap-4 sm:grid-cols-2 lg:mt-12 lg:gap-5'>
              {faq.map((item, i) => (
                <details
                  key={item.q}
                  data-reveal={`faq-${i}`}
                  className={`group rounded-xl border border-[var(--editor-shell-border)] bg-[var(--editor-shell-panel-strong)] px-5 py-[18px] open:border-fg/14 open:shadow-[0_12px_32px_rgb(var(--surface-fg-rgb)/0.06)] hover:border-fg/12 ${transitionReveal} ${revealClass(`faq-${i}`)}`}
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
            data-reveal='closing-cta'
            className={`overflow-hidden rounded-3xl px-6 py-12 text-center md:px-12 md:py-14 ${transitionReveal} ${revealClass('closing-cta')}`}
            style={{ background: 'var(--gradient-primary)', WebkitBackfaceVisibility: 'hidden' }}
          >
            <h2 className='text-xl font-semibold text-white md:text-2xl'>{t('closingTitle')}</h2>
            <p className='mx-auto mt-3 max-w-[46ch] text-sm leading-7 text-white/85'>
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
          data-reveal='site-footer'
          aria-label='Site footer'
          className={`mx-auto max-w-6xl px-5 pb-10 md:pb-12 ${transitionReveal} ${revealClass('site-footer')}`}
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
      </div>
    </main>
  );
}
