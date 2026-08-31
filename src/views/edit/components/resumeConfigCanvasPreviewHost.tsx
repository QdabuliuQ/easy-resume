'use client';

import { observer } from 'mobx-react';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import ResumePageSkeleton from '@/components/resume/ResumePageSkeleton';
import defaultResume from '@/json/resume.defaults';
import { homeExpandThumbUrl } from '@/lib/cdnThumbUrl';
import { resumePreviewStore } from '@/mobx/resumePreviewStore';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Page } from '@/modules';
import { flattenModules } from '@/utils/resumePages';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';
import ResumeFontCdn from '@/views/edit/components/canvas/resumeFontCdn';
import CanvasPreviewOverlay from '@/views/edit/components/canvas/canvasPreviewOverlay';

const PREVIEW_FRAME =
  'relative mx-auto overflow-hidden rounded-[2px] border border-[color:var(--editor-shell-border)] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.12)]';

/** 与图片导出一致：展平模块 + continuous，避免按页高裁切看不到后半内容 */
function ResumeConfigPreviewPages({ config }: { config: Record<string, unknown> }) {
  const [painted, setPainted] = useState(false);
  const gs = useMemo(
    () =>
      mergeGlobalStylePaper(
        defaultResume.globalStyle as GlobalStyle,
        (config.globalStyle ?? {}) as Partial<GlobalStyle>,
      ),
    [config],
  );
  const { width: pageW } = globalStylePageDimensions(gs);
  const modules = useMemo(() => flattenModules(config), [config]);
  const { main, sideSlot } = useMemo(
    () => renderResumePageModules(modules, gs, { isFirstPage: true }),
    [modules, gs],
  );

  useLayoutEffect(() => {
    setPainted(false);
    let raf = 0;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setPainted(true));
    });
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [config]);

  return (
    <>
      <ResumeFontCdn font={gs.resumeFont} />
      <div
        className={PREVIEW_FRAME}
        style={{ width: pageW, maxWidth: '100%', colorScheme: 'light' }}
        aria-busy={!painted}
      >
        <div
          className={`absolute inset-0 z-[2] transition-opacity duration-300 motion-reduce:transition-none${painted ? ' pointer-events-none opacity-0' : ' opacity-100'}`}
          aria-hidden={painted}
        >
          <ResumePageSkeleton />
        </div>
        <div
          className={`relative z-[1] transition-opacity duration-300 motion-reduce:transition-none${painted ? ' opacity-100' : ' opacity-0'}`}
        >
          <Page {...gs} continuous firstPage sideSlot={sideSlot ?? undefined}>
            {main}
          </Page>
        </div>
      </div>
    </>
  );
}

function ResumePreviewImage({
  src,
  onFailed,
}: {
  src: string;
  onFailed: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const thumbSrc = useOriginal ? src : homeExpandThumbUrl(src);

  useEffect(() => {
    setReady(false);
    setUseOriginal(false);
  }, [src]);

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!thumbSrc || !img) return;
    if (img.complete && img.naturalWidth > 0) setReady(true);
  }, [thumbSrc]);

  // 固定 A4 盒：骨架与图片同宽同高，避免 w-max+% 宽度塌成 0
  return (
    <div
      className={PREVIEW_FRAME}
      style={{
        width: 720,
        maxWidth: 'min(720px, calc(100vw - 2.5rem))',
        aspectRatio: '210 / 297',
        colorScheme: 'light',
      }}
      aria-busy={!ready}
    >
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-300 motion-reduce:transition-none${ready ? ' pointer-events-none opacity-0' : ' opacity-100'}`}
        aria-hidden={ready}
      >
        <ResumePageSkeleton />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={thumbSrc}
        alt=''
        draggable={false}
        decoding='async'
        className={`absolute inset-0 z-[1] h-full w-full object-cover object-top transition-opacity duration-300 motion-reduce:transition-none${ready ? ' opacity-100' : ' opacity-0'}`}
        onLoad={() => setReady(true)}
        onError={() => {
          if (!useOriginal) {
            setReady(false);
            setUseOriginal(true);
            return;
          }
          onFailed();
        }}
      />
    </div>
  );
}

function ResumeConfigCanvasPreviewHost() {
  const tc = useTranslations('Edit.canvas');
  const { open, closing, title, config, previewImage } = resumePreviewStore;
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [previewImage, open]);

  const showImage = Boolean(previewImage) && !imgFailed;

  return (
    <CanvasPreviewOverlay
      open={open}
      closing={closing}
      title={title || tc('textPreview')}
      closeAria={tc('closePreview')}
      onClose={() => resumePreviewStore.requestClose()}
    >
      {showImage ? (
        <ResumePreviewImage src={previewImage} onFailed={() => setImgFailed(true)} />
      ) : config ? (
        <ResumeConfigPreviewPages config={config as Record<string, unknown>} />
      ) : null}
    </CanvasPreviewOverlay>
  );
}

export default memo(observer(ResumeConfigCanvasPreviewHost));
