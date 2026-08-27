'use client';

import type { ResumeTemplateItem } from '@/json/resumeTemplates';
import { Link } from '@/i18n/navigation';
import {
  applyPhysicsCloneTransform,
  centerStateFromFrame,
  computeExpandToCenter,
  frameFromCenterState,
  type ExpandAnimFrame,
} from '@/lib/home/expandedResumeLayout';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PhysicsTemplateCard, {
  getPhysicsCardMetrics,
  PHYSICS_CARD_TITLE_H,
  PHYSICS_CARD_WIDTH,
} from './PhysicsTemplateCard';

gsap.registerPlugin(useGSAP);

export type ExpandAnchor = {
  index: number;
  fromFrame: ExpandAnimFrame;
};

function syncOverlayCardSize(shell: HTMLElement, frame: ExpandAnimFrame, pw: number, titleH: number) {
  const cardRoot = shell.querySelector('[data-physics-card-root]') as HTMLElement | null;
  const preview = shell.querySelector('[data-resume-preview]') as HTMLElement | null;
  const inner = preview?.firstElementChild as HTMLElement | null;
  if (cardRoot) cardRoot.style.width = `${frame.cardWidth}px`;
  if (preview) preview.style.height = `${Math.max(0, frame.shellH - titleH)}px`;
  if (inner && pw > 0) inner.style.transform = `scale(${frame.cardWidth / pw})`;
}

const navBtnCls =
  'pointer-events-auto inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-fg/14 bg-[color-mix(in_srgb,var(--editor-shell-panel-strong)_72%,transparent)] text-fg/80 shadow-[0_8px_24px_rgb(var(--surface-fg-rgb)/0.12)] backdrop-blur-sm transition-[transform,background-color,border-color,color] duration-200 hover:border-fg/22 hover:bg-[color-mix(in_srgb,var(--editor-shell-panel-strong)_88%,transparent)] hover:text-fg/96 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-35 motion-reduce:transition-none';

function NavChevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox='0 0 24 24' className='size-5' aria-hidden>
      <path
        d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export default memo(function ResumeExpandOverlay({
  anchor,
  template,
  totalCount,
  reduceMotion,
  onHideOriginal,
  onNavigate,
  onClosed,
}: {
  anchor: ExpandAnchor;
  template: ResumeTemplateItem;
  totalCount: number;
  reduceMotion: boolean;
  onHideOriginal: () => void;
  onNavigate: (index: number) => void;
  onClosed: (opts: { hideClone: () => void }) => void;
}) {
  const tm = useTranslations('Home.marquee');
  const fromFrame = anchor.fromFrame;
  const backdropRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const cloneReadyRef = useRef(false);
  const openedRef = useRef(false);
  const prevTemplateIdRef = useRef(template.id);
  const closeTargetFrameRef = useRef(fromFrame);
  const initialFromFrameRef = useRef(fromFrame);
  const frameRef = useRef<ExpandAnimFrame>(fromFrame);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [hoverReady, setHoverReady] = useState(false);
  const metrics = useMemo(() => getPhysicsCardMetrics(template), [template]);
  const { pw, ph, gs } = metrics;
  const canPrev = anchor.index > 0;
  const canNext = anchor.index < totalCount - 1;
  const editHref = `/edit?template=${anchor.index + 1}&color=${encodeURIComponent(String(gs.color ?? '#525252'))}`;

  const readToFrame = useCallback(
    (): ExpandAnimFrame =>
      computeExpandToCenter(pw, ph, window.innerWidth, window.innerHeight, PHYSICS_CARD_TITLE_H),
    [ph, pw],
  );

  const displayCardWidth = useMemo(() => readToFrame().cardWidth, [readToFrame]);

  const paint = useCallback(
    (frame: ExpandAnimFrame) => {
      frameRef.current = frame;
      const shell = shellRef.current;
      if (!shell) return;
      applyPhysicsCloneTransform(shell, frame);
      syncOverlayCardSize(shell, frame, pw, PHYSICS_CARD_TITLE_H);
    },
    [pw],
  );

  const hideClone = useCallback(() => {
    const shell = shellRef.current;
    const backdrop = backdropRef.current;
    const nav = navRef.current;
    if (shell) {
      shell.style.visibility = 'hidden';
      shell.style.pointerEvents = 'none';
    }
    if (nav) gsap.set(nav, { autoAlpha: 0, pointerEvents: 'none' });
    if (backdrop) gsap.set(backdrop, { autoAlpha: 0 });
  }, []);

  const runClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setHoverReady(false);
    const shell = shellRef.current;
    const backdrop = backdropRef.current;
    const nav = navRef.current;
    if (!shell || !backdrop) {
      onClosed({ hideClone });
      return;
    }
    tweenRef.current?.kill();
    const dur = reduceMotion ? 0 : 0.52;
    const closeTarget = closeTargetFrameRef.current;
    const state = centerStateFromFrame(frameRef.current);
    const to = centerStateFromFrame(closeTarget);
    gsap.to(backdrop, { autoAlpha: 0, duration: dur });
    if (nav) gsap.to(nav, { autoAlpha: 0, duration: dur, pointerEvents: 'none' });
    tweenRef.current = gsap.to(state, {
      ...to,
      duration: dur,
      ease: 'power2.inOut',
      onUpdate: () => paint(frameFromCenterState(state)),
      onComplete: () => {
        paint(closeTarget);
        onClosed({ hideClone });
      },
    });
  }, [hideClone, onClosed, paint, reduceMotion]);

  const goPrev = useCallback(() => {
    if (canPrev) onNavigate(anchor.index - 1);
  }, [anchor.index, canPrev, onNavigate]);

  const goNext = useCallback(() => {
    if (canNext) onNavigate(anchor.index + 1);
  }, [anchor.index, canNext, onNavigate]);

  useLayoutEffect(() => {
    closeTargetFrameRef.current = anchor.fromFrame;
  }, [anchor.fromFrame, anchor.index]);

  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    const nav = navRef.current;
    if (!backdrop || openedRef.current) return;
    openedRef.current = true;
    cloneReadyRef.current = true;
    frameRef.current = initialFromFrameRef.current;
    paint(initialFromFrameRef.current);
    gsap.set(backdrop, { autoAlpha: 0 });
    if (nav) gsap.set(nav, { autoAlpha: 0 });
    onHideOriginal();
  }, [onHideOriginal, paint]);

  useLayoutEffect(() => {
    if (!cloneReadyRef.current || prevTemplateIdRef.current === template.id) return;
    prevTemplateIdRef.current = template.id;
    const to = readToFrame();
    paint(to);
    const shell = shellRef.current;
    if (shell && !reduceMotion && !closingRef.current) {
      gsap.fromTo(shell, { opacity: 0.88 }, { opacity: 1, duration: 0.18, ease: 'power1.out' });
    }
  }, [template.id, readToFrame, paint, reduceMotion]);

  useGSAP(() => {
    const backdrop = backdropRef.current;
    const nav = navRef.current;
    if (!backdrop) return;

    const to = readToFrame();
    paint(initialFromFrameRef.current);

    if (reduceMotion) {
      paint(to);
      gsap.set(backdrop, { autoAlpha: 1 });
      if (nav) gsap.set(nav, { autoAlpha: 1 });
      setHoverReady(true);
      return;
    }

    const state = centerStateFromFrame(initialFromFrameRef.current);
    const toCenter = centerStateFromFrame(to);
    const tl = gsap.timeline({
      onComplete: () => {
        if (!closingRef.current) setHoverReady(true);
      },
    });
    tl.to(backdrop, { autoAlpha: 1, duration: 0.28, ease: 'power2.out' }, 0);
    if (nav) tl.to(nav, { autoAlpha: 1, duration: 0.28, ease: 'power2.out' }, 0);
    tl.to(
      state,
      {
        ...toCenter,
        duration: 0.56,
        ease: 'power2.inOut',
        onUpdate: () => paint(frameFromCenterState(state)),
      },
      0,
    );
    return () => {
      tl.kill();
    };
  }, { dependencies: [paint, readToFrame, reduceMotion] });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') runClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      tweenRef.current?.kill();
    };
  }, [goNext, goPrev, runClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        ref={backdropRef}
        className='fixed inset-0 z-[200] bg-[var(--home-expand-scrim)] backdrop-blur-[3px]'
        onClick={runClose}
        aria-hidden
      />
      <div
        ref={navRef}
        className='pointer-events-none fixed inset-0 z-[202] flex items-center justify-between px-3 sm:px-5'
      >
        <button
          type='button'
          className={navBtnCls}
          disabled={!canPrev}
          aria-label={tm('prevTemplate')}
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
        >
          <NavChevron dir='left' />
        </button>
        <button
          type='button'
          className={navBtnCls}
          disabled={!canNext}
          aria-label={tm('nextTemplate')}
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
        >
          <NavChevron dir='right' />
        </button>
      </div>
      <div
        ref={shellRef}
        className='pointer-events-auto fixed left-0 top-0 isolate z-[201] origin-center overflow-hidden will-change-transform'
        role='dialog'
        aria-modal='true'
        aria-label={template.title}
        onClick={(e) => e.stopPropagation()}
      >
        <PhysicsTemplateCard
          template={template}
          cardWidth={displayCardWidth || PHYSICS_CARD_WIDTH}
          showTitle
          previewHoverSlot={
            hoverReady ? (
              <Link
                href={editHref}
                className='pointer-events-auto inline-flex min-w-[148px] items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-primary-gradient-start)] to-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold no-underline shadow-[0_8px_24px_rgb(0_0_0/0.28)]'
                style={{ color: '#ffffff' }}
                onClick={(e) => e.stopPropagation()}
              >
                {tm('useTemplate')}
              </Link>
            ) : undefined
          }
        />
      </div>
    </>,
    document.body,
  );
});
