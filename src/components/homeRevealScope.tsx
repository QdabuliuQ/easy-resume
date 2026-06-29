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

const REVEAL_FROM_Y = 28;
const REVEAL_HIDE_Y = 22;

export default function HomeRevealScope({ reduceMotion, children }: HomeRevealScopeProps) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;

      const items = gsap.utils.toArray<HTMLElement>('[data-home-reveal]', scope);
      if (!items.length) return;

      if (reduceMotion) {
        gsap.set(items, { autoAlpha: 1, y: 0, scale: 1 });
        return;
      }

      gsap.set(items, { autoAlpha: 0, y: REVEAL_FROM_Y, scale: 0.98 });

      const triggers = items.map((el) => {
        const show = () => {
          gsap.to(el, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.62,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        };
        const hide = () => {
          gsap.to(el, {
            autoAlpha: 0,
            y: REVEAL_HIDE_Y,
            scale: 0.98,
            duration: 0.42,
            ease: 'power2.in',
            overwrite: 'auto',
          });
        };
        return ScrollTrigger.create({
          trigger: el,
          start: 'top 88%',
          end: 'top 18%',
          onEnter: show,
          onEnterBack: show,
          onLeave: hide,
          onLeaveBack: hide,
        });
      });

      return () => {
        for (const st of triggers) st.kill();
      };
    },
    { scope: scopeRef, dependencies: [reduceMotion], revertOnUpdate: true },
  );

  return (
    <div ref={scopeRef} className='contents'>
      {children}
    </div>
  );
}
