'use client';

import defaultResume from '@/json/resume.defaults';
import type { ResumeTemplateItem } from '@/json/resumeTemplates';
import ResumePageSkeleton from '@/components/resume/ResumePageSkeleton';
import { homeExpandThumbUrl, homeListThumbUrl } from '@/lib/cdnThumbUrl';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Page } from '@/modules';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';
import ResumeFontCdn from '@/views/edit/components/canvas/resumeFontCdn';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export const PHYSICS_CARD_WIDTH = 128;
/** mt-1(4px) + leading-4(16px) */
export const PHYSICS_CARD_TITLE_H = 20;

export function getPhysicsCardMetrics(template: ResumeTemplateItem) {
  const gs = mergeGlobalStylePaper(
    defaultResume.globalStyle as GlobalStyle,
    template?.config?.globalStyle ?? {},
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
  const listImgRef = useRef<HTMLImageElement>(null);
  const sharpImgRef = useRef<HTMLImageElement>(null);
  const [painted, setPainted] = useState(false);
  const [listReady, setListReady] = useState(false);
  const [sharpReady, setSharpReady] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  /** imageView2 失败时回退原图，避免整卡永久骨架 */
  const [listUseOriginal, setListUseOriginal] = useState(false);
  const [scale, setScale] = useState(0.2);
  const metrics = useMemo(() => getPhysicsCardMetrics(template), [template]);
  const { gs, pw, pwStr, phStr } = metrics;
  const previewH = pw > 0 ? cardWidth * (metrics.ph / pw) : 170;
  const previewImage = template.previewImage?.trim() || '';
  const isExpand = cardWidth > PHYSICS_CARD_WIDTH;
  const listThumbSrc = useMemo(() => {
    if (!previewImage) return '';
    return listUseOriginal ? previewImage : homeListThumbUrl(previewImage);
  }, [previewImage, listUseOriginal]);
  const sharpThumbSrc = useMemo(
    () => (previewImage && isExpand ? homeExpandThumbUrl(previewImage) : ''),
    [previewImage, isExpand],
  );
  const modules = useMemo(() => template.config.pages?.[0]?.modules ?? [], [template]);
  const needLive = !previewImage || imgFailed;
  const { main, sideSlot } = useMemo(
    () =>
      needLive && modules.length
        ? renderResumePageModules(modules as unknown[], gs, { isFirstPage: true })
        : { main: null, sideSlot: null },
    [modules, gs, needLive],
  );

  useEffect(() => {
    setListReady(false);
    setSharpReady(false);
    setImgFailed(false);
    setListUseOriginal(false);
  }, [previewImage, template.id]);

  useLayoutEffect(() => {
    const img = listImgRef.current;
    if (!listThumbSrc || imgFailed || !img) return;
    if (img.complete && img.naturalWidth > 0) setListReady(true);
  }, [listThumbSrc, imgFailed]);

  useLayoutEffect(() => {
    const img = sharpImgRef.current;
    if (!sharpThumbSrc || imgFailed || !img) return;
    if (img.complete && img.naturalWidth > 0) setSharpReady(true);
  }, [sharpThumbSrc, imgFailed]);

  useLayoutEffect(() => {
    if (previewImage && !imgFailed) return;
    setPainted(false);
    let raf = 0;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setPainted(true));
    });
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [template.id, previewImage, imgFailed]);

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

  const hasImage = Boolean(previewImage) && !imgFailed;
  const displayReady = hasImage ? (isExpand ? sharpReady || listReady : listReady) : painted;
  const showExpandLoading = isExpand && hasImage && !sharpReady;

  return (
    <div className='cursor-pointer select-none [&_*]:cursor-pointer [&_*]:select-none' data-physics-card-root style={{ width: cardWidth }}>
      <div
        ref={wrapRef}
        className={`relative overflow-hidden cursor-pointer select-none shadow-[0_4px_16px_rgb(0_0_0/0.1)] [&_*]:cursor-pointer [&_*]:select-none${previewHoverSlot ? ' group/preview' : ''}`}
        data-resume-preview
        style={{ height: previewH, colorScheme: 'light' }}
        aria-busy={!displayReady || showExpandLoading}
      >
        <div
          className={`absolute inset-0 z-0 transition-opacity duration-300 motion-reduce:transition-none${displayReady ? ' pointer-events-none opacity-0' : ' opacity-100'}`}
          aria-hidden={displayReady}
        >
          <ResumePageSkeleton />
        </div>
        {needLive && modules.length ? (
          <div
            className={`absolute left-0 top-0 z-[1] origin-top-left transition-opacity duration-300 motion-reduce:transition-none${painted ? ' opacity-100' : ' opacity-0'}`}
            style={{
              transform: `scale(${scale})`,
              width: pwStr,
              height: phStr,
            }}
          >
            <ResumeFontCdn font={gs.resumeFont} />
            <Page {...gs} firstPage sideSlot={sideSlot ?? undefined}>
              {main}
            </Page>
          </div>
        ) : null}
        {listThumbSrc && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={listImgRef}
            src={listThumbSrc}
            alt={isExpand ? '' : template.title}
            aria-hidden={isExpand || undefined}
            draggable={false}
            decoding='async'
            loading='eager'
            onLoad={() => setListReady(true)}
            onError={() => {
              if (!listUseOriginal && previewImage) {
                setListReady(false);
                setListUseOriginal(true);
                return;
              }
              setImgFailed(true);
            }}
            className={`absolute inset-0 z-[2] h-full w-full object-cover object-top transition-opacity duration-300 motion-reduce:transition-none${listReady && !sharpReady ? ' opacity-100' : ' opacity-0'}`}
          />
        ) : null}
        {sharpThumbSrc && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={sharpImgRef}
            src={sharpThumbSrc}
            alt={template.title}
            draggable={false}
            decoding='async'
            loading='eager'
            fetchPriority='high'
            onLoad={() => setSharpReady(true)}
            onError={() => {
              // 展开图失败时保留 list 糊图，不整卡失败
              setSharpReady(false);
            }}
            className={`absolute inset-0 z-[3] h-full w-full object-cover object-top transition-opacity duration-300 motion-reduce:transition-none${sharpReady ? ' opacity-100' : ' opacity-0'}`}
          />
        ) : null}
        {showExpandLoading ? (
          <div
            className='pointer-events-none absolute inset-0 z-[4] flex items-center justify-center bg-[rgb(255_255_255/0.35)]'
            aria-hidden
          >
            <div
              className='size-12 rounded-full border-[3px] border-[rgb(0_0_0/0.12)] border-t-[var(--color-primary)] animate-spin motion-reduce:animate-none'
              role='status'
            />
          </div>
        ) : null}
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
