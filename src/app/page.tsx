'use client';

import Link from 'next/link';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  getAppTheme,
  getServerAppTheme,
  subscribeAppTheme,
  toggleAppTheme,
} from '@/lib/themeStore';

type Feature = {
  title: string;
  desc: string;
};

const FEATURES: Feature[] = [
  {
    title: '模块化编辑',
    desc: '按模块快速调整内容结构，支持工作经历、项目、教育、技能等核心板块。',
  },
  {
    title: 'AI 智能建议',
    desc: '结合岗位表达习惯给出优化建议，帮助简历内容更聚焦、更有结果导向。',
  },
  {
    title: '一键多格式导出',
    desc: '同一份配置可导出 PDF、PNG 与 JSON，便于投递、预览与版本管理。',
  },
];

export default function Home() {
  const appTheme = useSyncExternalStore(
    subscribeAppTheme,
    getAppTheme,
    getServerAppTheme,
  );
  const [scrolled, setScrolled] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [finePointer, setFinePointer] = useState(true);
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
      { threshold: 0.16, rootMargin: '0px 0px -40px 0px' }
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

    if (!finePointer) {
      glow.style.transform = 'translate3d(calc(50vw - 240px), calc(40vh - 240px), 0)';
      return;
    }

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
  }, [finePointer]);

  const navClass = useMemo(
    () =>
      `fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-fg/10 shadow-[0_12px_36px_rgb(var(--surface-fg-rgb)/0.08)] backdrop-blur-xl'
          : 'bg-transparent'
      }`,
    [scrolled]
  );

  const navStyle = scrolled
    ? {
        background:
          'linear-gradient(90deg, color-mix(in srgb, var(--editor-shell-bg) 92%, black), color-mix(in srgb, var(--color-primary) 20%, var(--editor-shell-bg)), color-mix(in srgb, var(--editor-shell-bg) 88%, black))',
      }
    : undefined;

  const revealClass = (key: string) =>
    reveal[key]
      ? 'translate-y-0 opacity-100'
      : 'translate-y-4 opacity-0';

  return (
    <main className='relative min-h-screen overflow-x-hidden bg-[var(--editor-shell-bg)] text-[var(--text-strong)]'>
      <div className='pointer-events-none absolute inset-0'>
        <div
          ref={glowRef}
          className='fixed left-0 top-0 h-[480px] w-[480px] rounded-full blur-[90px] transition-opacity duration-500 will-change-transform'
          style={{
            opacity: finePointer ? 0.78 : 0.56,
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 26%, transparent), color-mix(in srgb, var(--color-primary-gradient-start) 22%, transparent) 42%, transparent 74%)',
          }}
        />
        <div
          className='absolute -top-28 left-[-10%] h-[360px] w-[360px] rounded-full blur-2xl'
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 32%, transparent), transparent 72%)',
          }}
        />
        <div
          className='absolute top-[18%] right-[-6%] h-[340px] w-[340px] rounded-full blur-2xl'
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary-gradient-start) 30%, transparent), transparent 70%)',
          }}
        />
        <div
          className='absolute bottom-[12%] left-[35%] h-[260px] w-[260px] rounded-full blur-2xl'
          style={{
            background:
              'radial-gradient(circle, color-mix(in srgb, var(--color-primary) 20%, transparent), transparent 68%)',
          }}
        />
      </div>

      <header className={navClass} style={navStyle}>
        <div className='mx-auto flex h-16 max-w-6xl items-center justify-between px-5'>
          <div className='flex items-center gap-2'>
            <span className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-fg/12 bg-fg/[0.06] text-sm font-semibold'>
              E
            </span>
            <span className='text-sm font-semibold tracking-[0.12em] text-fg/90'>EASYRESUME</span>
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={toggleAppTheme}
              aria-label={appTheme === 'dark' ? '切换为浅色' : '切换为深色'}
              className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-fg/14 bg-fg/[0.06] text-fg/85 transition-colors hover:bg-fg/10'
            >
              {appTheme === 'dark' ? (
                <SunOutlined className='text-[15px]' />
              ) : (
                <MoonOutlined className='text-[15px]' />
              )}
            </button>
            <Link
              href='/edit'
              className='inline-flex h-9 items-center justify-center rounded-full border border-fg/14 bg-fg/[0.07] px-4 text-sm font-medium text-fg/92 transition-transform duration-200 hover:-translate-y-px hover:bg-fg/11'
            >
              立即开始
            </Link>
          </div>
        </div>
      </header>

      <section className='relative mx-auto flex min-h-[92vh] w-full max-w-6xl items-center px-5 pb-16 pt-28 md:pt-32'>
        <div className='grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]'>
          <div className='space-y-6'>
            <p
              className='inline-flex items-center rounded-full px-3 py-1 text-[11px] tracking-[0.14em]'
              style={{
                border: '1px solid color-mix(in srgb, var(--color-primary-gradient-start) 36%, transparent)',
                background: 'color-mix(in srgb, var(--color-primary-gradient-start) 14%, transparent)',
                color: 'color-mix(in srgb, var(--color-primary-gradient-start) 55%, var(--text-strong))',
              }}
            >
              SMART RESUME EDITOR
            </p>
            <h1 className='max-w-[14ch] text-4xl font-semibold leading-[1.08] text-fg/96 md:text-6xl'>
              快速编辑简历，稳定导出，精准投递
            </h1>
            <p className='max-w-[62ch] text-base leading-7 text-fg/62'>
              面向求职者打造的高效简历编辑器。模块化编辑、AI 智能建议与多格式导出协同工作，帮你在最短时间内完成更专业的简历版本。
            </p>
            <div className='flex flex-wrap items-center gap-4'>
              <Link
                href='/edit'
                className='group relative inline-flex h-12 min-w-[158px] items-center justify-center overflow-hidden rounded-xl border border-fg/18 px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgb(var(--surface-fg-rgb)/0.12)] transition-transform duration-200 hover:-translate-y-[2px]'
                style={{ background: 'var(--gradient-primary)' }}
              >
                <span className='relative text-white'>立即开始</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id='features' className='mx-auto w-full max-w-6xl px-5 py-16 md:py-20'>
        <div
          data-reveal='features-title'
          className={`mb-8 transition-all duration-500 ${revealClass('features-title')}`}
        >
          <h2 className='text-2xl font-semibold text-fg/94 md:text-3xl'>核心功能特性</h2>
          <p className='mt-2 max-w-[64ch] text-sm leading-7 text-fg/58'>
            为真实求职流程设计的关键能力，减少重复调整，让内容表达更清晰。
          </p>
        </div>
        <div className='grid gap-4 md:grid-cols-3'>
          {FEATURES.map((item, idx) => (
            <article
              key={item.title}
              data-reveal={`feature-${idx}`}
              className={`editor-shell-card group rounded-2xl p-5 backdrop-blur-lg transition-all duration-500 hover:-translate-y-[4px] ${revealClass(
                `feature-${idx}`
              )}`}
              style={{
                borderColor:
                  'color-mix(in srgb, var(--color-primary-gradient-start) 22%, rgb(var(--surface-fg-rgb) / 0.12))',
              }}
            >
              <div className='mb-4 h-[2px] w-16' style={{ background: 'var(--gradient-primary)' }} />
              <h3 className='text-base font-semibold text-fg/92'>{item.title}</h3>
              <p className='mt-2 text-sm leading-7 text-fg/60'>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
