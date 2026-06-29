'use client';

import gsap from 'gsap';
import { useEffect, useRef, type ReactNode } from 'react';

type HomeRevealScopeProps = {
  reduceMotion: boolean;
  children: ReactNode;
};

const REVEAL_FROM_Y = 28;
const SHOW_DELAY = 0.14;
const SHOW = { autoAlpha: 1, y: 0, scale: 1 } as const;
const HIDE = { autoAlpha: 0, y: REVEAL_FROM_Y, scale: 0.98 } as const;

export default function HomeRevealScope({ reduceMotion, children }: HomeRevealScopeProps) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    const items = Array.from(scope.querySelectorAll<HTMLElement>('[data-home-reveal]'));
    if (!items.length) return;

    if (reduceMotion) {
      gsap.set(items, SHOW);
      return;
    }

    gsap.set(items, HIDE);

    const tweens = new Map<HTMLElement, gsap.core.Tween>();

    const animate = (el: HTMLElement, visible: boolean) => {
      tweens.get(el)?.kill();
      const tween = gsap.to(el, {
        ...(visible ? SHOW : HIDE),
        duration: visible ? 0.62 : 0.42,
        delay: visible ? SHOW_DELAY : 0,
        ease: visible ? 'power2.out' : 'power2.in',
        overwrite: 'auto',
      });
      tweens.set(el, tween);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          animate(target as HTMLElement, isIntersecting);
        }
      },
      { threshold: 0.08 },
    );

    for (const el of items) io.observe(el);

    return () => {
      io.disconnect();
      tweens.forEach((tween) => tween.kill());
    };
  }, [reduceMotion]);

  return (
    <div ref={scopeRef} className='contents'>
      {children}
    </div>
  );
}
