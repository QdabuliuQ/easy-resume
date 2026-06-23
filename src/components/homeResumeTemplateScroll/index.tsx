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
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

const SCROLL_PER_CARD = 180;
const GALLERY_PAD_X = 28;
const GALLERY_TITLE_SPACE = 56;
const CARD_SCALE_MAX = 0.7;
const CARD_SCALE_MIN = 0.24;
const GALLERY_HEIGHT_CLASS =
  'h-[calc(100vh-env(safe-area-inset-top,0px)-3.5rem)] sm:h-[calc(100vh-env(safe-area-inset-top,0px)-4rem)]';

function getDefaultPageSize() {
  const gs = mergeGlobalStylePaper(
    defaultResume.globalStyle as GlobalStyle,
    resumeTemplates[0]?.config.globalStyle ?? {},
  );
  const { width, height } = globalStylePageDimensions(gs);
  return {
    width: cssLengthToApproxPx(width),
    height: cssLengthToApproxPx(height),
  };
}

function computeCardMetrics(galleryW: number, galleryH: number) {
  const page = getDefaultPageSize();
  if (galleryW <= 0 || galleryH <= 0) {
    return { scale: CARD_SCALE_MAX, gap: 340, page };
  }
  const availW = Math.max(1, galleryW - GALLERY_PAD_X * 2);
  const availH = Math.max(1, galleryH - GALLERY_TITLE_SPACE - GALLERY_PAD_X);
  const scale = Math.max(
    CARD_SCALE_MIN,
    Math.min(CARD_SCALE_MAX, availW / page.width, availH / page.height),
  );
  const scaledW = page.width * scale;
  const gap = Math.max(scaledW * 0.78, Math.min(galleryW * 0.68, 420));
  return { scale, gap, page };
}

function layoutCards(cards: HTMLElement[], activeIndex: number, gapPx: number) {
  cards.forEach((card, i) => {
    const offset = i - activeIndex;
    const distance = Math.abs(offset);
    const isActive = distance < 0.55;
    card.dataset.active = isActive ? 'true' : 'false';
    gsap.set(card, {
      x: offset * gapPx,
      scale: Math.max(0.5, 1 - distance * 0.2),
      opacity: distance > 2.5 ? 0 : Math.max(0.2, 1 - distance * 0.32),
      zIndex: 300 - Math.round(distance * 10),
      pointerEvents: isActive ? 'auto' : 'none',
    });
  });
}

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, Draggable);
}

const TemplatePageScaled = memo(function TemplatePageScaled({
  template,
  scale,
  templateIndex1Based,
  useTemplateLabel,
}: {
  template: ResumeTemplateItem;
  scale: number;
  templateIndex1Based: number;
  useTemplateLabel: string;
}) {
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
    () => renderResumePageModules(modules as unknown[], gs, { isFirstPage: true }),
    [modules, gs],
  );
  const editHref = `/edit?template=${templateIndex1Based}&color=${encodeURIComponent(String(gs.color ?? '#525252'))}`;
  return (
    <div
      className='home-template-card-preview relative isolate shrink-0 cursor-pointer overflow-hidden rounded-md bg-white text-left text-[#333] leading-normal font-normal shadow-[0_20px_48px_rgb(0_0_0/0.14)] ring-1 ring-black/8'
      style={{ width: pw * scale, height: ph * scale, colorScheme: 'light' }}
    >
      <div
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
      <div className='home-template-card-overlay pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-150 ease-out'>
        <Link
          href={editHref}
          className='flex h-full w-full items-center justify-center bg-black/42'
          draggable={false}
        >
          <span className='rounded-full bg-gradient-to-r from-[var(--color-primary-gradient-start)] to-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgb(0_0_0/0.35)] sm:px-6 sm:py-3 sm:text-base'>
            {useTemplateLabel}
          </span>
        </Link>
      </div>
    </div>
  );
});

function StaticTemplateGrid({
  useTemplateLabel,
  cardScale,
}: {
  useTemplateLabel: string;
  cardScale: number;
}) {
  return (
    <div className='flex flex-wrap justify-center gap-6 px-4 py-8 md:gap-7'>
      {resumeTemplates.map((tpl, i) => (
        <div key={tpl.id} className='home-template-card-static flex flex-col items-center'>
          <TemplatePageScaled
            template={tpl}
            scale={cardScale}
            templateIndex1Based={i + 1}
            useTemplateLabel={useTemplateLabel}
          />
          <span className='mt-3 block max-w-[min(100vw-2rem,320px)] truncate px-1 text-center text-sm font-semibold text-fg/72 sm:text-base'>
            {tpl.title}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function HomeResumeTemplateScroll({ reduceMotion }: { reduceMotion: boolean }) {
  const tm = useTranslations('Home.marquee');
  const galleryRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLUListElement>(null);
  const dragProxyRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const cardGapRef = useRef(340);
  const [cardScale, setCardScale] = useState(CARD_SCALE_MAX);

  const syncGalleryMetrics = useCallback(() => {
    const gallery = galleryRef.current;
    if (!gallery) return null;
    const { width, height } = gallery.getBoundingClientRect();
    const metrics = computeCardMetrics(width, height);
    setCardScale(metrics.scale);
    cardGapRef.current = metrics.gap;
    return metrics;
  }, []);

  useLayoutEffect(() => {
    if (reduceMotion) {
      syncGalleryMetrics();
      return;
    }
    const gallery = galleryRef.current;
    const cardsEl = cardsRef.current;
    const dragProxy = dragProxyRef.current;
    if (!gallery || !cardsEl || !dragProxy) return;

    const cards = gsap.utils.toArray<HTMLElement>('.home-template-card-stage', cardsEl);
    if (!cards.length) return;

    const applyMetrics = () => {
      const metrics = syncGalleryMetrics();
      if (!metrics) return;
      layoutCards(cards, activeIndexRef.current, metrics.gap);
    };

    applyMetrics();

    gsap.set(cards, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      xPercent: -50,
      yPercent: -50,
      transformOrigin: '50% 50%',
    });

    const cardCount = cards.length;
    const maxIndex = Math.max(1, cardCount - 1);
    const snapIndex = gsap.utils.snap(1 / maxIndex);
    const animScroll = maxIndex * SCROLL_PER_CARD;

    const progressToIndex = (progress: number) => gsap.utils.clamp(0, maxIndex, progress * maxIndex);
    const indexToProgress = (index: number) => index / maxIndex;

    layoutCards(cards, 0, cardGapRef.current);
    activeIndexRef.current = 0;

    const scrollToIndex = (index: number, st: ScrollTrigger) => {
      st.scroll(st.start + indexToProgress(index) * animScroll);
    };

    const trigger = ScrollTrigger.create({
      trigger: gallery,
      start: 'bottom bottom',
      end: `+=${animScroll}`,
      pin: true,
      anticipatePin: 1,
      onUpdate(self) {
        const scrolled = self.scroll() - self.start;
        const index = progressToIndex(scrolled / animScroll);
        activeIndexRef.current = index;
        layoutCards(cards, index, cardGapRef.current);
      },
      snap: {
        snapTo: (progress) => snapIndex(progress),
        duration: { min: 0.15, max: 0.35 },
        delay: 0.05,
      },
    });

    const draggable = Draggable.create(dragProxy, {
      type: 'x',
      trigger: cardsEl,
      dragClickable: true,
      minimumMovement: 14,
      allowContextMenu: true,
      ignore: 'a, .home-template-card-overlay, .home-template-card-preview',
      onPress() {
        const scrolled = trigger.scroll() - trigger.start;
        this.startIndex = progressToIndex(scrolled / animScroll);
      },
      onDrag() {
        const gap = cardGapRef.current;
        const delta = (this.startX - this.x) / gap;
        const next = gsap.utils.clamp(0, maxIndex, this.startIndex + delta);
        activeIndexRef.current = next;
        layoutCards(cards, next, gap);
        scrollToIndex(next, trigger);
      },
      onDragEnd() {
        const scrolled = trigger.scroll() - trigger.start;
        const snapped = snapIndex(scrolled / animScroll) * maxIndex;
        activeIndexRef.current = snapped;
        scrollToIndex(snapped, trigger);
        layoutCards(cards, snapped, cardGapRef.current);
      },
    })[0];

    const ro = new ResizeObserver(() => {
      applyMetrics();
      ScrollTrigger.refresh();
    });
    ro.observe(gallery);

    ScrollTrigger.refresh();

    return () => {
      ro.disconnect();
      draggable?.kill();
      trigger.kill();
      gsap.set(cards, { clearProps: 'all' });
    };
  }, [reduceMotion, syncGalleryMetrics]);

  useEffect(() => {
    if (reduceMotion) return;
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [reduceMotion]);

  if (reduceMotion) {
    return (
      <div className='relative w-full overflow-hidden border-y border-fg/10 bg-[rgb(var(--surface-fg-rgb)/0.03)]'>
        <div ref={galleryRef} className={`relative w-full ${GALLERY_HEIGHT_CLASS}`}>
          <StaticTemplateGrid useTemplateLabel={tm('useTemplate')} cardScale={cardScale} />
        </div>
      </div>
    );
  }

  return (
    <div className='relative w-full overflow-hidden border-y border-fg/10 bg-[rgb(var(--surface-fg-rgb)/0.03)]'>
      <div
        ref={galleryRef}
        className={`home-template-gallery relative w-full overflow-hidden ${GALLERY_HEIGHT_CLASS}`}
      >
        <ul
          ref={cardsRef}
          className='home-template-cards relative m-0 h-full w-full list-none overflow-hidden p-0'
        >
          {resumeTemplates.map((tpl, i) => (
            <li key={tpl.id} className='pointer-events-none absolute inset-0'>
              <div className='home-template-card-stage pointer-events-auto relative flex flex-col items-center will-change-transform'>
                <TemplatePageScaled
                  template={tpl}
                  scale={cardScale}
                  templateIndex1Based={i + 1}
                  useTemplateLabel={tm('useTemplate')}
                />
                <span className='mt-3 max-w-[min(100vw-2rem,320px)] truncate px-1 text-center text-sm font-semibold text-fg/72 sm:text-base'>
                  {tpl.title}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div
          ref={dragProxyRef}
          className='drag-proxy pointer-events-none absolute inset-0 z-[400] touch-pan-y'
          aria-hidden
        />
      </div>
    </div>
  );
}
