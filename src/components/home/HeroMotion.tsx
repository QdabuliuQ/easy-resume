'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

gsap.registerPlugin(useGSAP);

type HeroMotionProps = {
  reduceMotion: boolean;
  ready: boolean;
  onIntroComplete?: () => void;
  className?: string;
  children: React.ReactNode;
};

export default function HeroMotion({ reduceMotion, ready, onIntroComplete, className, children }: HeroMotionProps) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope || !ready) return;
      if (reduceMotion) {
        gsap.set(scope.querySelectorAll('[data-home-hero], [data-home-hero-preview]'), { autoAlpha: 1, y: 0 });
        onIntroComplete?.();
        return;
      }
      const copyItems = gsap.utils.toArray<HTMLElement>('[data-home-hero]', scope);
      const preview = scope.querySelector<HTMLElement>('[data-home-hero-preview]');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => onIntroComplete?.() });
      if (copyItems.length) tl.from(copyItems, { autoAlpha: 0, y: 28, duration: 0.72, stagger: 0.08 });
      if (preview) tl.from(preview, { autoAlpha: 0, y: 20, scale: 0.98, duration: 0.82 }, '-=0.42');
    },
    { scope: scopeRef, dependencies: [reduceMotion, ready], revertOnUpdate: true },
  );

  return (
    <div
      ref={scopeRef}
      className={
        reduceMotion
          ? className
          : `${className ?? ''} [&_[data-home-hero]]:opacity-0 [&_[data-home-hero-preview]]:opacity-0`
      }
    >
      {children}
    </div>
  );
}
