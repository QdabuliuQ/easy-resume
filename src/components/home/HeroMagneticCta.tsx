'use client';

import gsap from 'gsap';
import { memo, useEffect, useRef, type KeyboardEvent } from 'react';

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

export default HeroMagneticCta;
