'use client';

import defaultResume from '@/json/resume.defaults';
import { resumeTemplates, type ResumeTemplateItem } from '@/json/resumeTemplates';
import { Link } from '@/i18n/navigation';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Page } from '@/modules';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';
import ResumeFontCdn from '@/views/edit/components/canvas/resumeFontCdn';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, forwardRef } from 'react';
import { createPortal } from 'react-dom';

gsap.registerPlugin(useGSAP);

/** 1=向下流, -1=向上流 */
const COL_DIRS = [1, -1, 1, -1] as const;
const COL_COUNT = 4;
const COL_GAP = 12;
const COL_SPEED = 1.5;
const AUTO_SCROLL_PX_PER_SEC = 28;
const SCROLL_IDLE_MS = 1000;
const STAGGER_COLS = new Set([1, 3]);
const LOOP_COPIES = 2;
const LAZY_ROOT_MARGIN = '160px 0px';
const templateRenderCache = new Set<string>();
const templateHeightCache = new Map<string, number>();

function CardLoading() {
  return (
    <div className='absolute inset-0 flex flex-col gap-3 bg-fg/[0.04] p-4' aria-hidden>
      <div className='h-[16%] rounded-md bg-fg/[0.08]' />
      <div className='min-h-0 flex-1 rounded-md bg-fg/[0.06]' />
      <div className='h-[10%] rounded-md bg-fg/[0.05]' />
      <div className='absolute inset-0 flex items-center justify-center'>
        <span className='h-5 w-5 animate-spin rounded-full border-2 border-fg/12 border-t-fg/45' />
      </div>
    </div>
  );
}

type ColumnItem = { template: ResumeTemplateItem; index: number };

function splitColumns(items: ColumnItem[]) {
  const cols: ColumnItem[][] = Array.from({ length: COL_COUNT }, () => []);
  items.forEach((item, i) => cols[i % COL_COUNT].push(item));
  return cols;
}

function displayItems(items: ColumnItem[], dir: 1 | -1) {
  if (dir > 0 || items.length <= 1) return items;
  const last = items[items.length - 1];
  return [last, ...items.slice(0, -1)];
}

function positiveMod(n: number, m: number) {
  return ((n % m) + m) % m;
}

function loopOffset(scroll: number, loopH: number, speed: number, dir: 1 | -1, phase = 0) {
  if (loopH <= 0) return 0;
  const raw = positiveMod(scroll * speed + phase, loopH);
  if (dir > 0) return -raw;
  return raw - loopH;
}

function estimateCardHeight(template: ResumeTemplateItem) {
  const gs = mergeGlobalStylePaper(
    defaultResume.globalStyle as GlobalStyle,
    template.config.globalStyle,
  );
  const { width, height } = globalStylePageDimensions(gs);
  const pw = cssLengthToApproxPx(width);
  const ph = cssLengthToApproxPx(height);
  if (pw <= 0) return 220;
  return pw * (ph / pw) + 32;
}

function buildLoopLayout(heights: number[]) {
  const tops: number[] = [];
  let y = 0;
  for (let i = 0; i < heights.length; i++) {
    tops.push(y);
    y += heights[i] + COL_GAP;
  }
  return { tops, loopH: y };
}

type ColumnTrackHandle = {
  syncScroll: (scroll: number) => void;
};

const TemplateCard = memo(function TemplateCard({
  template,
  previewLabel,
  onPreview,
  onHeight,
  eager = false,
}: {
  template: ResumeTemplateItem;
  previewLabel: string;
  onPreview: () => void;
  onHeight?: (height: number) => void;
  eager?: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cached = templateRenderCache.has(template.id);
  const [active, setActive] = useState(cached || eager);
  const [painted, setPainted] = useState(cached || eager);
  const [scale, setScale] = useState(0.2);
  const gs = useMemo(
    () =>
      mergeGlobalStylePaper(
        defaultResume.globalStyle as GlobalStyle,
        template.config.globalStyle,
      ),
    [template],
  );
  const { width: pwStr, height: phStr } = globalStylePageDimensions(gs);
  const pw = cssLengthToApproxPx(pwStr);
  const ph = cssLengthToApproxPx(phStr);
  const modules = useMemo(() => template.config.pages?.[0]?.modules ?? [], [template]);
  const { main, sideSlot } = useMemo(
    () => (active ? renderResumePageModules(modules as unknown[], gs, { isFirstPage: true }) : { main: null, sideSlot: null }),
    [active, modules, gs],
  );

  useEffect(() => {
    if (active) return;
    if (eager) {
      setActive(true);
      return;
    }
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setActive(true);
        io.disconnect();
      },
      { rootMargin: LAZY_ROOT_MARGIN },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active, eager]);

  useLayoutEffect(() => {
    if (!active || painted) return;
    let raf = 0;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        templateRenderCache.add(template.id);
        setPainted(true);
      });
    });
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active, painted, template.id]);

  useEffect(() => {
    if (!active || pw <= 0) return;
    const el = wrapRef.current;
    if (!el) return;
    const sync = () => setScale(Math.max(0.08, el.clientWidth / pw));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [active, pw]);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || !onHeight) return;
    const report = () => {
      const h = el.offsetHeight;
      if (h > 0) onHeight(h);
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeight, painted, active, template.id]);

  const showLoading = !active || !painted;

  return (
    <article ref={rootRef} data-masonry-card className='w-full shrink-0'>
      <div
        ref={wrapRef}
        className='group relative w-full overflow-hidden rounded-lg border border-[color:var(--home-template-card-border)] bg-white transition-[border-color] duration-200 hover:border-[color:var(--home-template-card-border-hover)]'
        style={{ aspectRatio: `${pw} / ${ph}`, colorScheme: 'light' }}
        aria-busy={showLoading}
      >
        {active ? (
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
        ) : null}
        {showLoading ? <CardLoading /> : null}
        <button
          type='button'
          aria-label={previewLabel}
          onClick={onPreview}
          disabled={showLoading}
          className='absolute inset-0 z-10 flex cursor-pointer items-center justify-center border-0 bg-black/0 p-0 opacity-0 transition-[opacity,background-color] duration-200 group-hover:bg-black/40 group-hover:opacity-100 disabled:pointer-events-none'
        >
          <span className='rounded-full bg-gradient-to-r from-[var(--color-primary-gradient-start)] to-[var(--color-primary)] px-3 py-1.5 text-[11px] font-semibold text-white'>
            {previewLabel}
          </span>
        </button>
      </div>
      <p className='mt-2 truncate px-0.5 text-center text-sm font-medium text-fg/62'>{template.title}</p>
    </article>
  );
});

function TemplatePreviewModal({
  item,
  useTemplateLabel,
  onClose,
}: {
  item: ColumnItem | null;
  useTemplateLabel: string;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);
  const template = item?.template;
  const index = item?.index ?? 0;
  const gs = useMemo(
    () =>
      template
        ? mergeGlobalStylePaper(
            defaultResume.globalStyle as GlobalStyle,
            template.config.globalStyle,
          )
        : null,
    [template],
  );
  const dims = gs ? globalStylePageDimensions(gs) : null;
  const pw = dims ? cssLengthToApproxPx(dims.width) : 0;
  const ph = dims ? cssLengthToApproxPx(dims.height) : 0;
  const modules = useMemo(() => template?.config.pages?.[0]?.modules ?? [], [template]);
  const { main, sideSlot } = useMemo(
    () => (gs ? renderResumePageModules(modules as unknown[], gs, { isFirstPage: true }) : { main: null, sideSlot: null }),
    [modules, gs],
  );
  const editHref = `/edit?template=${index + 1}&color=${encodeURIComponent(String(gs?.color ?? '#525252'))}`;

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [item, onClose]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || pw <= 0 || ph <= 0) return;
    const sync = () => {
      const pad = 32;
      const maxW = Math.max(1, el.clientWidth - pad);
      const maxH = Math.max(1, el.clientHeight - pad);
      setScale(Math.max(0.12, Math.min(1, maxW / pw, maxH / ph)));
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pw, ph, item]);

  if (!item || !template || !gs || !dims || typeof document === 'undefined') return null;

  return createPortal(
    <div className='fixed inset-0 z-[200] flex flex-col bg-[var(--editor-shell-bg)]' role='dialog' aria-modal='true' aria-label={template.title}>
      <div className='flex shrink-0 items-center justify-between gap-3 border-b border-fg/10 px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] sm:px-6'>
        <p className='min-w-0 truncate text-base font-semibold text-fg/92 sm:text-lg'>{template.title}</p>
        <button
          type='button'
          onClick={onClose}
          aria-label='close'
          className='inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-fg/14 bg-fg/[0.05] text-lg text-fg/70'
        >
          ×
        </button>
      </div>
      <div ref={wrapRef} className='flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-6'>
        <div
          className='overflow-hidden rounded-lg bg-white shadow-[0_20px_48px_rgb(0_0_0/0.22)] ring-1 ring-black/8'
          style={{ width: pw * scale, height: ph * scale, colorScheme: 'light' }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: dims.width,
              height: dims.height,
            }}
          >
            <ResumeFontCdn font={gs.resumeFont} />
            <Page {...gs} firstPage sideSlot={sideSlot ?? undefined}>
              {main}
            </Page>
          </div>
        </div>
      </div>
      <div className='flex shrink-0 justify-center border-t border-fg/10 px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]'>
        <Link
          href={editHref}
          className='inline-flex h-11 min-w-[160px] items-center justify-center rounded-xl px-6 text-sm font-semibold no-underline'
          style={{ background: 'var(--gradient-primary)', color: '#ffffff' }}
        >
          {useTemplateLabel}
        </Link>
      </div>
    </div>,
    document.body,
  );
}

const ColumnTrack = forwardRef<ColumnTrackHandle, {
  items: ColumnItem[];
  previewLabel: string;
  onPreview: (item: ColumnItem) => void;
  direction: 1 | -1;
  phase: number;
  onCardHalfHeight?: (height: number) => void;
}>(function ColumnTrack(
  { items, previewLabel, onPreview, direction, phase, onCardHalfHeight },
  ref,
) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const setTrackYRef = useRef<ReturnType<typeof gsap.quickSetter> | null>(null);
  const scrollRef = useRef(0);
  const layoutRef = useRef({ loopH: 0 });
  const [heights, setHeights] = useState<number[]>(() =>
    items.map((item) => templateHeightCache.get(item.template.id) ?? estimateCardHeight(item.template)),
  );
  const orderedItems = useMemo(() => displayItems(items, direction), [items, direction]);

  const setItemHeight = useCallback((itemIdx: number, height: number) => {
    const id = orderedItems[itemIdx]?.template.id;
    if (!id || templateHeightCache.has(id)) return;
    templateHeightCache.set(id, height);
    setHeights((prev) => {
      let changed = false;
      const next = prev.map((h, i) => {
        if (orderedItems[i]?.template.id !== id) return h;
        if (h === height) return h;
        changed = true;
        return height;
      });
      return changed ? next : prev;
    });
  }, [orderedItems]);

  useLayoutEffect(() => {
    setHeights(items.map((item) => templateHeightCache.get(item.template.id) ?? estimateCardHeight(item.template)));
  }, [items]);

  const { tops, loopH } = useMemo(() => buildLoopLayout(heights), [heights]);

  useLayoutEffect(() => {
    if (trackRef.current) setTrackYRef.current = gsap.quickSetter(trackRef.current, 'y', 'px');
  }, []);

  useLayoutEffect(() => {
    layoutRef.current = { loopH };
  }, [loopH]);

  const syncScroll = useCallback(
    (scroll: number) => {
      scrollRef.current = scroll;
      const { loopH: lh } = layoutRef.current;
      if (lh <= 0) return;
      const trackY = loopOffset(scroll, lh, COL_SPEED, direction, phase);
      setTrackYRef.current?.(trackY);
    },
    [direction, phase],
  );

  useImperativeHandle(ref, () => ({ syncScroll }), [syncScroll]);

  useLayoutEffect(() => {
    syncScroll(scrollRef.current);
  }, [loopH, phase, syncScroll]);

  useLayoutEffect(() => {
    if (heights[0] > 0 && onCardHalfHeight) onCardHalfHeight(heights[0] / 2);
  }, [heights, onCardHalfHeight]);

  return (
    <div className='h-full overflow-hidden'>
      <div
        ref={trackRef}
        className='relative w-full will-change-transform'
        style={{ height: loopH > 0 ? loopH * LOOP_COPIES : undefined }}
      >
        {Array.from({ length: LOOP_COPIES }, (_, copy) =>
          orderedItems.map((item, itemIdx) => (
            <div
              key={`${copy}-${item.template.id}`}
              className='absolute inset-x-0 top-0'
              style={{ transform: `translateY(${tops[itemIdx] + copy * loopH}px)` }}
            >
              <TemplateCard
                eager
                template={item.template}
                previewLabel={previewLabel}
                onPreview={() => onPreview(item)}
                onHeight={(ht) => setItemHeight(itemIdx, ht)}
              />
            </div>
          )),
        )}
      </div>
    </div>
  );
});

export default function TemplateMasonry({ reduceMotion = false }: { reduceMotion?: boolean }) {
  const tm = useTranslations('Home.marquee');
  const [previewItem, setPreviewItem] = useState<ColumnItem | null>(null);
  const [staggerPhases, setStaggerPhases] = useState<number[]>(() => Array.from({ length: COL_COUNT }, () => 0));
  const scopeRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(ColumnTrackHandle | null)[]>(Array.from({ length: COL_COUNT }, () => null));
  const virtualScrollRef = useRef(0);
  const lastWindowScrollYRef = useRef(0);
  const userScrollingRef = useRef(false);
  const previewOpenRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const autoTickRef = useRef<(() => void) | null>(null);
  const autoLastTsRef = useRef(0);

  useEffect(() => {
    previewOpenRef.current = previewItem != null;
  }, [previewItem]);

  const syncAllColumns = useCallback((scroll: number) => {
    virtualScrollRef.current = scroll;
    columnRefs.current.forEach((col) => col?.syncScroll(scroll));
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoTickRef.current) {
      gsap.ticker.remove(autoTickRef.current);
      autoTickRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    if (reduceMotion || autoTickRef.current || previewOpenRef.current) return;
    lastWindowScrollYRef.current = window.scrollY;
    autoLastTsRef.current = performance.now();
    autoTickRef.current = () => {
      if (userScrollingRef.current || previewOpenRef.current) return;
      const now = performance.now();
      const dt = (now - autoLastTsRef.current) / 1000;
      autoLastTsRef.current = now;
      syncAllColumns(virtualScrollRef.current + AUTO_SCROLL_PX_PER_SEC * dt);
    };
    gsap.ticker.add(autoTickRef.current);
  }, [reduceMotion, syncAllColumns]);

  const scheduleAutoScroll = useCallback(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      userScrollingRef.current = false;
      if (!reduceMotion && !previewOpenRef.current) startAutoScroll();
    }, SCROLL_IDLE_MS);
  }, [reduceMotion, startAutoScroll]);

  const columns = useMemo(
    () =>
      splitColumns(
        resumeTemplates.map((template, index) => ({ template, index })),
      ),
    [],
  );

  const setCardHalfHeight = useCallback((colIdx: number, height: number) => {
    setStaggerPhases((prev) => {
      if (prev[colIdx] === height) return prev;
      const next = [...prev];
      next[colIdx] = height;
      return next;
    });
  }, []);

  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope || reduceMotion) return;

      const onUserScroll = () => {
        userScrollingRef.current = true;
        stopAutoScroll();
        const y = window.scrollY;
        const delta = y - lastWindowScrollYRef.current;
        lastWindowScrollYRef.current = y;
        if (delta !== 0) syncAllColumns(virtualScrollRef.current + delta);
        scheduleAutoScroll();
      };

      lastWindowScrollYRef.current = window.scrollY;
      syncAllColumns(window.scrollY);
      scheduleAutoScroll();
      window.addEventListener('scroll', onUserScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', onUserScroll);
        if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
        stopAutoScroll();
      };
    },
    { scope: scopeRef, dependencies: [reduceMotion, scheduleAutoScroll, stopAutoScroll, syncAllColumns], revertOnUpdate: true },
  );

  useEffect(() => {
    if (previewItem) {
      stopAutoScroll();
      return;
    }
    if (!userScrollingRef.current && !reduceMotion) scheduleAutoScroll();
  }, [previewItem, reduceMotion, scheduleAutoScroll, stopAutoScroll]);

  return (
    <>
      <div ref={scopeRef} className='h-full overflow-hidden px-3 sm:px-4'>
        <div className='flex h-full gap-3'>
          {columns.map((items, colIdx) => (
            <div key={colIdx} className='h-full min-w-0 flex-1 overflow-hidden'>
              <ColumnTrack
                ref={(handle) => {
                  columnRefs.current[colIdx] = handle;
                }}
                items={items}
                phase={staggerPhases[colIdx]}
                previewLabel={tm('preview')}
                onPreview={setPreviewItem}
                direction={COL_DIRS[colIdx]}
                onCardHalfHeight={STAGGER_COLS.has(colIdx) ? (h) => setCardHalfHeight(colIdx, h) : undefined}
              />
            </div>
          ))}
        </div>
      </div>
      <TemplatePreviewModal
        item={previewItem}
        useTemplateLabel={tm('useTemplate')}
        onClose={() => setPreviewItem(null)}
      />
    </>
  );
}
