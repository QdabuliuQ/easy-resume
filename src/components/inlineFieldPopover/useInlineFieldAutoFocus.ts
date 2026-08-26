'use client';
import { useLayoutEffect, useRef } from 'react';
import { focusFieldControlInHolder } from '@/lib/inlineFieldEdit/focusFieldControl';
import type { InlineFieldKind } from '@/lib/inlineFieldEdit/resolveFieldMeta';

export function useInlineFieldAutoFocus(
  itemId: string,
  kind: InlineFieldKind,
  focusIndex = 0,
) {
  const shellRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const holder = shellRef.current;
    if (!holder) return;
    let retries = kind === 'richText' ? 30 : 10;
    const tick = () => {
      const el = shellRef.current;
      if (!el) return;
      if (focusFieldControlInHolder(el, { focusIndex }) || retries <= 0) return;
      retries -= 1;
      window.setTimeout(tick, 80);
    };
    const delay = kind === 'richText' ? 120 : 0;
    const t0 = window.setTimeout(() => requestAnimationFrame(tick), delay);
    return () => window.clearTimeout(t0);
  }, [itemId, kind, focusIndex]);
  return shellRef;
}
