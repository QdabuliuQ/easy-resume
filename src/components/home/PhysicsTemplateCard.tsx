'use client';

import defaultResume from '@/json/resume.defaults';
import type { ResumeTemplateItem } from '@/json/resumeTemplates';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Page } from '@/modules';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';
import ResumeFontCdn from '@/views/edit/components/canvas/resumeFontCdn';
import { memo, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export const PHYSICS_CARD_WIDTH = 128;
/** mt-1(4px) + leading-4(16px) */
export const PHYSICS_CARD_TITLE_H = 20;

export function getPhysicsCardMetrics(template: ResumeTemplateItem) {
  const gs = mergeGlobalStylePaper(
    defaultResume.globalStyle as GlobalStyle,
    template.config.globalStyle,
  );
  const { width: pwStr, height: phStr } = globalStylePageDimensions(gs);
  const pw = cssLengthToApproxPx(pwStr);
  const ph = cssLengthToApproxPx(phStr);
  const previewH = pw > 0 ? PHYSICS_CARD_WIDTH * (ph / pw) : 170;
  return {
    gs,
    pw,
    ph,
    pwStr,
    phStr,
    bodyW: PHYSICS_CARD_WIDTH,
    bodyH: previewH + PHYSICS_CARD_TITLE_H,
    previewH,
  };
}

function CardLoading() {
  return (
    <div className='absolute inset-0 flex items-center justify-center' aria-hidden>
      <span className='h-4 w-4 animate-spin rounded-full border-2 border-fg/12 border-t-fg/45' />
    </div>
  );
}

export default memo(function PhysicsTemplateCard({
  template,
  cardWidth = PHYSICS_CARD_WIDTH,
  showTitle = true,
  previewHoverSlot,
}: {
  template: ResumeTemplateItem;
  cardWidth?: number;
  showTitle?: boolean;
  previewHoverSlot?: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [painted, setPainted] = useState(false);
  const [scale, setScale] = useState(0.2);
  const metrics = useMemo(() => getPhysicsCardMetrics(template), [template]);
  const { gs, pw, pwStr, phStr } = metrics;
  const previewH = pw > 0 ? cardWidth * (metrics.ph / pw) : 170;
  const modules = useMemo(() => template.config.pages?.[0]?.modules ?? [], [template]);
  const { main, sideSlot } = useMemo(
    () => renderResumePageModules(modules as unknown[], gs, { isFirstPage: true }),
    [modules, gs],
  );

  useLayoutEffect(() => {
    let raf = 0;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setPainted(true));
    });
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [template.id]);

  useLayoutEffect(() => {
    if (pw <= 0) return;
    setScale(Math.max(0.08, cardWidth / pw));
    const el = wrapRef.current;
    if (!el) return;
    const sync = () => setScale(Math.max(0.08, el.clientWidth / pw));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pw, cardWidth]);

  return (
    <div className='cursor-pointer select-none [&_*]:cursor-pointer [&_*]:select-none' data-physics-card-root style={{ width: cardWidth }}>
      <div
        ref={wrapRef}
        className={`relative overflow-hidden cursor-pointer select-none shadow-[0_4px_16px_rgb(0_0_0/0.1)] [&_*]:cursor-pointer [&_*]:select-none${previewHoverSlot ? ' group/preview' : ''}`}
        data-resume-preview
        style={{ height: previewH, colorScheme: 'light' }}
        aria-busy={!painted}
      >
        <div
          className={painted ? undefined : 'invisible'}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: pwStr,
            height: phStr,
          }}
        >
          <ResumeFontCdn font={gs.resumeFont} />
          <Page {...gs} firstPage sideSlot={sideSlot ?? undefined}>
            {main}
          </Page>
        </div>
        {!painted ? <CardLoading /> : null}
        {previewHoverSlot ? (
          <div className='pointer-events-none absolute inset-0 z-[100] flex items-center justify-center bg-transparent opacity-0 transition-[opacity,background-color] duration-200 group-hover/preview:pointer-events-auto group-hover/preview:bg-[rgb(0_0_0/0.68)] group-hover/preview:opacity-100'>
            {previewHoverSlot}
          </div>
        ) : null}
      </div>
      {showTitle ? (
        <p className='mt-1 truncate px-0.5 text-center text-[11px] leading-4 font-medium text-fg/58'>{template.title}</p>
      ) : null}
    </div>
  );
});
