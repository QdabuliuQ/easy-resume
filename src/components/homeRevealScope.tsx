'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef, type ReactNode } from 'react';

gsap.registerPlugin(useGSAP, ScrollTrigger);

type HomeRevealScopeProps = {
  reduceMotion: boolean;
  children: ReactNode;
};

export default function HomeRevealScope({ reduceMotion, children }: HomeRevealScopeProps) {
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

      gsap.set(items, { autoAlpha: 0, y: 32 });

      ScrollTrigger.batch(items, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.1,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        },
      });
    },
    { scope: scopeRef, dependencies: [reduceMotion], revertOnUpdate: true },
  );

  return (
    <div ref={scopeRef} className='contents'>
      {children}
    </div>
  );
}
