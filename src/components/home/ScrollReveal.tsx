'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ScrollRevealProps = {
  reduceMotion: boolean;
  children: React.ReactNode;
};

export default function ScrollReveal({ reduceMotion, children }: ScrollRevealProps) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;
      const items = gsap.utils.toArray<HTMLElement>('[data-home-reveal]', scope);
      if (!items.length) return;
      if (reduceMotion) {
        gsap.set(items, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.set(items, { autoAlpha: 0, y: 24 });
      for (const el of items) {
        gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      }
    },
    { scope: scopeRef, dependencies: [reduceMotion], revertOnUpdate: true },
  );

  return <div ref={scopeRef}>{children}</div>;
}
