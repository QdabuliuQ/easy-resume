'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

import HomeBackdrop from '@/components/home/HomeBackdrop';
import HomeTopNavActions from '@/components/home/HomeTopNavActions';
import HomeBrandMark from '@/components/home/HomeBrandMark';
import HomeHorizontalScroll from '@/components/home/HomeHorizontalScroll';
import { useReduceMotion } from '@/lib/home/useReduceMotion';

gsap.registerPlugin(useGSAP);

export default function HomeClient() {
  const mainRef = useRef<HTMLElement>(null);
  const [githubStars, setGithubStars] = useState<number | null>(null);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    let canceled = false;
    void fetch('https://api.github.com/repos/QdabuliuQ/easy-resume', {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { stargazers_count?: unknown } | null) => {
        if (canceled || !data) return;
        const n = data.stargazers_count;
        if (typeof n === 'number' && Number.isFinite(n)) setGithubStars(n);
      })
      .catch(() => undefined);
    return () => {
      canceled = true;
    };
  }, []);

  useGSAP(
    () => {
      const root = mainRef.current;
      if (!root) return;
      const items = gsap.utils.toArray<HTMLElement>('[data-home-enter]', root);
      if (!items.length) return;
      if (reduceMotion) {
        gsap.set(items, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 20 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.72,
          stagger: 0.09,
          ease: 'power3.out',
          clearProps: 'transform',
        },
      );
    },
    { scope: mainRef, dependencies: [reduceMotion], revertOnUpdate: true },
  );

  return (
    <main
      ref={mainRef}
      className={
        reduceMotion
          ? 'relative min-h-screen w-full bg-[var(--editor-shell-bg)] text-[var(--text-strong)]'
          : 'relative min-h-screen w-full bg-[var(--editor-shell-bg)] text-[var(--text-strong)] [&_[data-home-enter]]:opacity-0'
      }
    >
      <HomeBackdrop />
      <header className='home-header fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] sm:px-5'>
        <div data-home-enter data-home-interactive className='min-w-0 shrink'>
          <HomeBrandMark />
        </div>
        <div data-home-enter data-home-interactive className='shrink-0'>
          <HomeTopNavActions />
        </div>
      </header>
      <HomeHorizontalScroll reduceMotion={reduceMotion} githubStars={githubStars} />
    </main>
  );
}
