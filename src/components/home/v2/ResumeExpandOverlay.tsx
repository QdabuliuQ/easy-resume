'use client';

import type { ResumeTemplateItem } from '@/json/resumeTemplates';
import { Link } from '@/i18n/navigation';
import {
  applyPhysicsCloneTransform,
  centerStateFromFrame,
  computeExpandToCenter,
  frameFromCenterState,
  type ExpandAnimFrame,
} from '@/lib/homeV2/expandedResumeLayout';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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

export default memo(function ResumeExpandOverlay({
  anchor,
  template,
  reduceMotion,
  onHideOriginal,
  onClosed,
}: {
  anchor: ExpandAnchor;
  template: ResumeTemplateItem;
  reduceMotion: boolean;
  onHideOriginal: () => void;
  onClosed: () => void;
}) {
  const tm = useTranslations('Home.marquee');
  const fromFrame = anchor.fromFrame;
  const backdropRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const cloneReadyRef = useRef(false);
  const frameRef = useRef<ExpandAnimFrame>(fromFrame);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const metrics = useMemo(() => getPhysicsCardMetrics(template), [template]);
  const { pw, ph, gs } = metrics;
  const editHref = `/edit?template=${anchor.index + 1}&color=${encodeURIComponent(String(gs.color ?? '#525252'))}`;

  const readToFrame = useCallback(
    (): ExpandAnimFrame =>
      computeExpandToCenter(pw, ph, window.innerWidth, window.innerHeight, PHYSICS_CARD_TITLE_H),
    [ph, pw],
  );

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

  const runClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const shell = shellRef.current;
    const backdrop = backdropRef.current;
    if (!shell || !backdrop) {
      onClosed();
      return;
    }
    tweenRef.current?.kill();
    const dur = reduceMotion ? 0 : 0.52;
    const state = centerStateFromFrame(frameRef.current);
    const to = centerStateFromFrame(fromFrame);
    gsap.to(backdrop, { autoAlpha: 0, duration: dur });
    tweenRef.current = gsap.to(state, {
      ...to,
      duration: dur,
      ease: 'power2.inOut',
      onUpdate: () => paint(frameFromCenterState(state)),
      onComplete: () => {
        paint(fromFrame);
        onClosed();
      },
    });
  }, [fromFrame, onClosed, paint, reduceMotion]);

  useLayoutEffect(() => {
    frameRef.current = fromFrame;
    const backdrop = backdropRef.current;
    if (!backdrop) return;
    paint(fromFrame);
    gsap.set(backdrop, { autoAlpha: 0 });
    if (!cloneReadyRef.current) {
      cloneReadyRef.current = true;
      onHideOriginal();
    }
  }, [fromFrame, onHideOriginal, paint]);

  useGSAP(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;

    const to = readToFrame();
    paint(fromFrame);

    if (reduceMotion) {
      paint(to);
      gsap.set(backdrop, { autoAlpha: 1 });
      return;
    }

    const state = centerStateFromFrame(fromFrame);
    const toCenter = centerStateFromFrame(to);
    const tl = gsap.timeline();
    tl.to(backdrop, { autoAlpha: 1, duration: 0.28, ease: 'power2.out' }, 0);
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
  }, { dependencies: [fromFrame, paint, readToFrame, reduceMotion] });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') runClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      tweenRef.current?.kill();
    };
  }, [runClose]);

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
        ref={shellRef}
        className='pointer-events-auto fixed left-0 top-0 isolate z-[201] origin-center overflow-hidden will-change-transform'
        role='dialog'
        aria-modal='true'
        aria-label={template.title}
        onClick={(e) => e.stopPropagation()}
      >
        <PhysicsTemplateCard
          template={template}
          cardWidth={fromFrame.cardWidth || PHYSICS_CARD_WIDTH}
          showTitle
          previewHoverSlot={
            <Link
              href={editHref}
              className='pointer-events-auto inline-flex min-w-[148px] items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-primary-gradient-start)] to-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold no-underline shadow-[0_8px_24px_rgb(0_0_0/0.28)]'
              style={{ color: '#ffffff' }}
              onClick={(e) => e.stopPropagation()}
            >
              {tm('useTemplate')}
            </Link>
          }
        />
      </div>
    </>,
    document.body,
  );
});
