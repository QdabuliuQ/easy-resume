'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useMemo, useRef } from 'react';

gsap.registerPlugin(useGSAP);

type TechBackdropProps = {
  reduceMotion: boolean;
  pointerX: number;
  pointerY: number;
};

export default function TechBackdrop({ reduceMotion, pointerX, pointerY }: TechBackdropProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const transform = useMemo(() => {
    if (reduceMotion || typeof window === 'undefined') return 'translate3d(0,0,0)';
    const nx = pointerX / window.innerWidth - 0.5;
    const ny = pointerY / window.innerHeight - 0.5;
    return `translate3d(${(nx * 28).toFixed(2)}px, ${(ny * 24).toFixed(2)}px, 0)`;
  }, [pointerX, pointerY, reduceMotion]);

  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope || reduceMotion) return;
      const orbits = gsap.utils.toArray<HTMLElement>('[data-home-orbit]', scope);
      if (!orbits.length) return;
      orbits.forEach((el, idx) => {
        gsap.to(el, {
          rotate: idx % 2 === 0 ? 360 : -360,
          duration: 28 + idx * 6,
          ease: 'none',
          repeat: -1,
        });
      });
      gsap.to(scope, { opacity: 1, duration: 0.8, ease: 'power2.out' });
    },
    { scope: scopeRef, dependencies: [reduceMotion], revertOnUpdate: true },
  );

  return (
    <div ref={scopeRef} aria-hidden className='pointer-events-none absolute inset-0 opacity-100' style={reduceMotion ? undefined : { opacity: 0 }}>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,color-mix(in_srgb,var(--color-primary)_18%,transparent),transparent_58%)]' />
      <div
        className='absolute inset-[-16%] bg-[linear-gradient(transparent_0,transparent_97%,color-mix(in_srgb,var(--color-primary)_12%,transparent)_98%),linear-gradient(90deg,transparent_0,transparent_97%,color-mix(in_srgb,var(--color-primary)_10%,transparent)_98%)] bg-[length:44px_44px] opacity-70'
        style={{ transform, transition: reduceMotion ? undefined : 'transform 420ms cubic-bezier(0.22,1,0.36,1)' }}
      />
      <div className='absolute left-[8vw] top-[20vh] h-[34vh] w-[34vh] rounded-full border border-fg/[0.08]'>
        <div data-home-orbit className='absolute inset-0'>
          <span className='absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_52%,transparent)]' />
        </div>
      </div>
      <div className='absolute right-[10vw] top-[16vh] h-[42vh] w-[42vh] rounded-full border border-fg/[0.06]'>
        <div data-home-orbit className='absolute inset-0'>
          <span className='absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full border border-fg/[0.16] bg-[var(--editor-shell-bg)]' />
        </div>
      </div>
    </div>
  );
}
