'use client';

import { memo, useEffect, useRef } from 'react';
import Typed from 'typed.js';

const HeroTypingTitle = memo(function HeroTypingTitle({
  reduceMotion,
  lines,
}: {
  reduceMotion: boolean;
  lines: string[];
}) {
  const elRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let iv: number | undefined;
    if (reduceMotion) {
      let idx = 0;
      el.textContent = lines[0];
      iv = window.setInterval(() => {
        idx = (idx + 1) % lines.length;
        el.textContent = lines[idx];
      }, 2800);
      return () => {
        if (iv !== undefined) window.clearInterval(iv);
      };
    }
    el.textContent = '';
    const typed = new Typed(el, {
      strings: lines,
      typeSpeed: 46,
      backSpeed: 30,
      backDelay: 2280,
      startDelay: 120,
      loop: true,
      smartBackspace: false,
      showCursor: true,
      cursorChar: '|',
      autoInsertCss: true,
      contentType: 'null',
    });
    return () => {
      typed.destroy();
    };
  }, [reduceMotion, lines]);
  return (
    <h1 className='min-h-[2.2lh] max-w-full px-2 text-center text-[1.625rem] font-semibold leading-[1.2] tracking-tight text-balance text-fg/96 sm:px-0 sm:text-4xl md:min-h-[1.15lh] md:text-[clamp(2.25rem,4vw+1rem,3.75rem)]'>
      <span ref={elRef} className='inline align-top' />
    </h1>
  );
});

export default HeroTypingTitle;
