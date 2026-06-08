'use client';

import Image from 'next/image';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { preview, previewLight } from '@/lib/brandAssets';

type HeroPreviewCompareProps = {
  reduceMotion: boolean;
  onDragStateChange?: (dragging: boolean) => void;
  compareFigure: string;
  compareSlider: string;
  previewLightAlt: string;
  previewDarkAlt: string;
  focusRingClass: string;
  pointerX: number;
  pointerY: number;
};

export default function HeroPreviewCompare({
  reduceMotion,
  onDragStateChange,
  compareFigure,
  compareSlider,
  previewLightAlt,
  previewDarkAlt,
  focusRingClass,
  pointerX,
  pointerY,
}: HeroPreviewCompareProps) {
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
    if (!wrapRef.current?.hasPointerCapture(e.pointerId) && e.pointerType === 'touch') return;
    scheduleApplyClientX(e.clientX);
  };

  const onPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    cancelSnap();
    cancelDragRaf();
    onDragStateChange?.(true);
    refreshWrapGeom();
    applyClientX(e.clientX);
  };

  const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || wrapRef.current?.hasPointerCapture(e.pointerId)) return;
    cancelDragRaf();
    pendingXRef.current = null;
    onDragStateChange?.(false);
    setPct(pctRef.current);
    snapToCenter();
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

  const perspectiveTransform = useMemo(() => {
    if (reduceMotion) return 'perspective(1200px) translateZ(0px) rotateX(0deg) rotateY(0deg)';
    const el = wrapRef.current;
    if (!el) return 'perspective(1200px) translateZ(0px) rotateX(0deg) rotateY(0deg)';
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return 'perspective(1200px) translateZ(0px) rotateX(0deg) rotateY(0deg)';
    }

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = Math.max(-1, Math.min(1, (pointerX - cx) / (rect.width / 2)));
    const ny = Math.max(-1, Math.min(1, (pointerY - cy) / (rect.height / 2)));
    const rotateY = nx * 4.5;
    const rotateX = -ny * 4.5;
    const dist = Math.min(1, Math.hypot(nx, ny));
    const translateZ = 6 + dist * 10;
    return `perspective(1200px) translateZ(${translateZ.toFixed(2)}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  }, [pointerX, pointerY, reduceMotion]);

  return (
    <figure
      className='mx-auto w-[80vw] max-w-[min(900px,92vw)]'
      aria-label={compareFigure}
      style={{ perspective: '1200px' }}
    >
      <div
        ref={wrapRef}
        className='relative w-full touch-none overflow-hidden rounded-2xl border border-white/[0.09] bg-[rgb(22_20_24)] shadow-[0_28px_80px_rgb(0_0_0/0.45)] ring-1 ring-white/[0.04]'
        style={{
          ['--compare-pct' as string]: `${pct.toFixed(3)}%`,
          ['--compare-fr' as string]: String(Math.max(pct / 100, 0.001)),
          WebkitBackfaceVisibility: 'hidden',
          willChange: 'transform',
          transformStyle: 'preserve-3d',
          transform: perspectiveTransform,
          transition: reduceMotion
            ? 'none'
            : 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onPointerEnter={onPointerEnter}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
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
          src={previewLight}
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
                src={preview}
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
          className={`group absolute inset-y-0 z-10 flex w-10 -translate-x-1/2 cursor-ew-resize flex-col items-center outline-none ${focusRingClass}`}
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