'use client';

import defaultResume from '@/json/resume.json';
import { resumeTemplates, type ResumeTemplateItem } from '@/json/resumeTemplates';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Info1, Page } from '@/modules';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import CanvasModuleFragment from '@/views/edit/components/canvas/moduleFragment';
import ResumeFontCdn from '@/views/edit/components/canvas/ResumeFontCdn';
import { EyeOutlined } from '@ant-design/icons';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent,
} from 'react';
import { createPortal } from 'react-dom';

function renderPageModules(modules: unknown[], gs: GlobalStyle): ReactNode[] {
  const mm = Number(gs.moduleMargin) || 15;
  const out: ReactNode[] = [];
  modules.forEach((raw, i) => {
    const m = raw as { type?: string; id?: string; options?: Record<string, unknown> };
    if (!m?.type) return;
    if (i > 0) out.push(<div key={`sp-${m.id ?? i}`} style={{ height: mm, flexShrink: 0 }} aria-hidden />);
    if (m.type === 'info1') {
      out.push(<Info1 key={String(m.id ?? `info-${i}`)} config={m as never} globalStyle={gs} />);
      return;
    }
    out.push(
      <CanvasModuleFragment
        key={String(m.id ?? `${m.type}-${i}`)}
        fragment={{
          type: m.type,
          sourceId: String(m.id ?? i),
          domId: String(m.id ?? i),
          showHeader: true,
          options: (m.options ?? {}) as Record<string, unknown>,
        }}
        globalStyle={gs}
      />
    );
  });
  return out;
}

const TemplatePageScaled = memo(function TemplatePageScaled({
  template,
  scale,
  templateIndex1Based,
  resumeTextColor,
  useTemplateLabel,
}: {
  template: ResumeTemplateItem;
  scale: number;
  templateIndex1Based?: number;
  resumeTextColor: string;
  useTemplateLabel: string;
}) {
  const gs = useMemo(() => {
    const merged = mergeGlobalStylePaper(
      defaultResume.globalStyle as GlobalStyle,
      template.config.globalStyle
    );
    return { ...merged, color: resumeTextColor };
  }, [template, resumeTextColor]);
  const { width: pwStr, height: phStr } = globalStylePageDimensions(gs);
  const pw = cssLengthToApproxPx(pwStr);
  const ph = cssLengthToApproxPx(phStr);
  const modules = template.config.pages[0]?.modules ?? [];
  const nodes = useMemo(() => renderPageModules(modules as unknown[], gs), [modules, gs]);
  const showUse =
    templateIndex1Based != null &&
    templateIndex1Based >= 1 &&
    templateIndex1Based <= resumeTemplates.length;
  const editHref = showUse ? `/edit?template=${templateIndex1Based}` : '';
  return (
    <div
      className={`relative isolate shrink-0 overflow-hidden rounded-md bg-white text-left text-[#333] leading-normal font-normal shadow-sm ring-1 ring-black/6 ${showUse ? 'group' : ''}`}
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
        <Page {...gs}>{nodes}</Page>
      </div>
      {showUse ? (
        <>
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 z-[9] rounded-md opacity-0 backdrop-blur-[2px] group-hover:opacity-100'
          />
          <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-150 ease-out group-hover:pointer-events-auto group-hover:opacity-100'>
            <Link
              href={editHref}
              className='flex h-full w-full items-center justify-center bg-black/42'
              onClick={(e) => e.stopPropagation()}
            >
              <span className='rounded-full bg-gradient-to-r from-[var(--color-primary-gradient-start)] to-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgb(0_0_0/0.35)]'>
                {useTemplateLabel}
              </span>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
});

const MARQUEE_SEC = Math.max(32, resumeTemplates.length * 4);
const LOOP = [...resumeTemplates, ...resumeTemplates];
/** 走马灯缩略图缩放（略大于原 0.2，便于扫读） */
const STRIP_SCALE = 0.28;
const SWATCH_ROTATE_MS = 2600;

function MarqueeTemplateThumb({
  template,
  resumeTextColor,
  useTemplateLabel,
  previewLabel,
}: {
  template: ResumeTemplateItem;
  resumeTextColor: string;
  useTemplateLabel: string;
  previewLabel: string;
}) {
  return (
    <div className='relative'>
      <div className='pointer-events-none'>
        <TemplatePageScaled
          template={template}
          scale={STRIP_SCALE}
          resumeTextColor={resumeTextColor}
          useTemplateLabel={useTemplateLabel}
        />
      </div>
      <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-md opacity-0 transition-opacity duration-200 ease-out group-hover/slide:opacity-100'>
        <div
          className='absolute inset-0 rounded-md bg-[color-mix(in_srgb,var(--color-primary)_22%,rgba(255,255,255,0.4))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-primary)_30%,transparent)]'
          aria-hidden
        />
        <span className='relative z-[1] inline-flex text-[17px] text-[var(--color-primary)] drop-shadow-sm [&_.anticon]:text-inherit [&_svg]:fill-current'>
          <EyeOutlined aria-hidden />
        </span>
        <span className='relative z-[1] text-[11px] font-semibold tracking-wide text-[var(--color-primary)] drop-shadow-sm'>
          {previewLabel}
        </span>
      </div>
    </div>
  );
}

function Mask({
  open,
  children,
  onClick,
  afterClose,
  style,
  reduceMotion,
  ariaLabel,
}: {
  open: boolean;
  children?: ReactNode;
  onClick?: () => void;
  afterClose?: () => void;
  style?: CSSProperties;
  reduceMotion?: boolean;
  ariaLabel: string;
}) {
  const [showPortal, setShowPortal] = useState(false);
  const [entered, setEntered] = useState(false);
  const openRef = useRef(open);
  const enteredRef = useRef(entered);
  openRef.current = open;
  enteredRef.current = entered;
  const afterCloseRef = useRef(afterClose);
  afterCloseRef.current = afterClose;
  useEffect(() => {
    if (!open) return;
    setShowPortal(true);
    if (reduceMotion) {
      setEntered(true);
      return;
    }
    setEntered(false);
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setEntered(true))
    );
    return () => cancelAnimationFrame(id);
  }, [open, reduceMotion]);
  useEffect(() => {
    if (open || !showPortal) return;
    setEntered(false);
    if (reduceMotion) {
      setShowPortal(false);
      afterCloseRef.current?.();
    }
  }, [open, showPortal, reduceMotion]);
  useEffect(() => {
    if (!showPortal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClick?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPortal, onClick]);
  useEffect(() => {
    if (!showPortal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showPortal]);
  const finishExit = (e: TransitionEvent<HTMLDivElement>) => {
    if (reduceMotion || openRef.current || enteredRef.current) return;
    if (e.propertyName !== 'opacity') return;
    if (e.target !== e.currentTarget) return;
    setShowPortal(false);
    afterCloseRef.current?.();
  };
  const wrapStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    ...style,
  };
  const fadeCls = reduceMotion
    ? ''
    : 'transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]';
  if (!showPortal || typeof document === 'undefined') return null;
  return createPortal(
    <div
      role='presentation'
      className={`fixed inset-0 flex min-h-full items-center justify-center overflow-y-auto bg-black/55 p-4 ${fadeCls} ${entered ? 'opacity-100' : 'opacity-0'}`}
      style={wrapStyle}
      onClick={() => onClick?.()}
      onTransitionEnd={finishExit}
    >
      <div
        role='dialog'
        aria-modal
        aria-label={ariaLabel}
        className={`pointer-events-auto ${fadeCls} ${entered ? 'opacity-100' : 'opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function HomeResumeTemplateMarquee({ reduceMotion }: { reduceMotion: boolean }) {
  const tm = useTranslations('Home.marquee');
  const swatches = tm.raw('swatches') as { label: string; bar: string; color: string }[];
  const [paused, setPaused] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<ResumeTemplateItem | null>(null);
  const [previewIndex1Based, setPreviewIndex1Based] = useState<number | null>(null);
  const [swatchIdx, setSwatchIdx] = useState(0);
  const resumeTextColor = swatches[swatchIdx]?.color ?? swatches[0].color;
  useEffect(() => {
    if (preview !== null || reduceMotion) return;
    const id = window.setInterval(() => {
      setSwatchIdx((i) => (i + 1) % swatches.length);
    }, SWATCH_ROTATE_MS);
    return () => window.clearInterval(id);
  }, [preview, reduceMotion, swatches.length]);
  const trackStyle: CSSProperties | undefined = reduceMotion
    ? undefined
    : {
        animationDuration: `${MARQUEE_SEC}s`,
        animationPlayState: paused ? 'paused' : 'running',
      };
  const slideBtn =
    'group/slide flex shrink-0 cursor-pointer flex-col items-center rounded-xl border border-fg/12 p-3 outline-none transition-transform duration-200 ease-out hover:scale-[1.045] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_58%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-bg)]';
  return (
    <>
      <div
        className='flex w-full min-h-[38px] shrink-0 items-end justify-stretch bg-[rgb(var(--surface-fg-rgb)/0.02)]'
        role='toolbar'
        aria-label={tm('previewToolbar')}
      >
        {swatches.map((s, i) => {
          const on = i === swatchIdx;
          return (
            <button
              key={s.label}
              type='button'
              title={s.label}
              aria-pressed={on}
              aria-label={s.label}
              onClick={() => setSwatchIdx(i)}
              style={{ backgroundColor: s.bar }}
              className={`min-h-0 min-w-0 flex-1 cursor-pointer border-0 p-0 outline-none transition-[height,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] ${on ? 'h-[38px] shadow-[inset_0_-3px_0_rgb(0_0_0/0.22)]' : 'h-[30px] hover:brightness-[0.97]'}`}
            />
          );
        })}
      </div>
      <div
        className='relative w-full overflow-hidden border-y border-fg/10 bg-[rgb(var(--surface-fg-rgb)/0.03)] py-6 md:py-8'
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {reduceMotion ? (
          <div className='flex flex-wrap justify-center gap-6 px-4 md:gap-7'>
            {resumeTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type='button'
                onClick={() => {
                  setPreview(tpl);
                  setPreviewIndex1Based(resumeTemplates.findIndex((x) => x.id === tpl.id) + 1);
                  setPreviewOpen(true);
                }}
                className={slideBtn}
              >
                <MarqueeTemplateThumb
                  template={tpl}
                  resumeTextColor={resumeTextColor}
                  useTemplateLabel={tm('useTemplate')}
                  previewLabel={tm('preview')}
                />
                <span className='mt-2 block w-full max-w-full truncate px-0.5 text-center text-xs text-fg/55'>
                  {tpl.title}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className='home-templates-marquee-track flex w-max gap-7 px-4 md:gap-9' style={trackStyle}>
            {LOOP.map((tpl, i) => (
              <button
                key={`${tpl.id}-${i}`}
                type='button'
                onClick={() => {
                  setPreview(tpl);
                  setPreviewIndex1Based(resumeTemplates.findIndex((x) => x.id === tpl.id) + 1);
                  setPreviewOpen(true);
                }}
                className={slideBtn}
              >
                <MarqueeTemplateThumb
                  template={tpl}
                  resumeTextColor={resumeTextColor}
                  useTemplateLabel={tm('useTemplate')}
                  previewLabel={tm('preview')}
                />
                <span className='mt-2 block w-full max-w-full truncate px-0.5 text-center text-xs text-fg/55'>
                  {tpl.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Mask
        open={previewOpen}
        reduceMotion={reduceMotion}
        ariaLabel={
          preview ? `${preview.title} ${tm('previewSuffix')}` : tm('templatePreviewFallback')
        }
        onClick={() => setPreviewOpen(false)}
        afterClose={() => {
          setPreview(null);
          setPreviewIndex1Based(null);
        }}
      >
        {preview ? (
          <TemplatePageScaled
            template={preview}
            scale={0.72}
            templateIndex1Based={previewIndex1Based ?? undefined}
            resumeTextColor={resumeTextColor}
            useTemplateLabel={tm('useTemplate')}
          />
        ) : null}
      </Mask>
    </>
  );
}
