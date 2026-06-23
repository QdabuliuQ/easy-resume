'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef, useSyncExternalStore, type ReactNode } from 'react';

gsap.registerPlugin(useGSAP);

const REVEAL_FROM = {
  top: { x: 0, y: -32 },
  left: { x: -40, y: 0 },
  bottom: { x: 0, y: 36 },
  right: { x: 40, y: 0 },
} as const;

type RevealDir = keyof typeof REVEAL_FROM;

const REVEAL_ORDER: Record<RevealDir, number> = {
  top: 0,
  left: 1,
  bottom: 2,
  right: 3,
};

type EditShellRevealProps = {
  children: ReactNode;
};

export default function EditShellReveal({ children }: EditShellRevealProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );

  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;

      const items = gsap.utils.toArray<HTMLElement>('[data-edit-reveal]', scope);
      if (!items.length) return;

      if (reduceMotion) {
        gsap.set(items, { autoAlpha: 1, x: 0, y: 0 });
        return;
      }

      items.sort((a, b) => {
        const da = a.dataset.editReveal as RevealDir;
        const db = b.dataset.editReveal as RevealDir;
        return (REVEAL_ORDER[da] ?? 9) - (REVEAL_ORDER[db] ?? 9);
      });

      const tl = gsap.timeline({ defaults: { duration: 0.6, ease: 'power2.out' } });
      items.forEach((el, i) => {
        const dir = el.dataset.editReveal as RevealDir;
        const from = REVEAL_FROM[dir] ?? { x: 0, y: 24 };
        tl.fromTo(
          el,
          { autoAlpha: 0, x: from.x, y: from.y },
          { autoAlpha: 1, x: 0, y: 0 },
          i * 0.11,
        );
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
