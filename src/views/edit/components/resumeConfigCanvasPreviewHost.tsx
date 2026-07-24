'use client';

import { observer } from 'mobx-react';
import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import defaultResume from '@/json/resume.defaults';
import { resumePreviewStore } from '@/mobx/resumePreviewStore';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Page } from '@/modules';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';
import ResumeFontCdn from '@/views/edit/components/canvas/resumeFontCdn';
import CanvasPreviewOverlay from '@/views/edit/components/canvas/canvasPreviewOverlay';

function ResumeConfigPreviewPages({ config }: { config: Record<string, unknown> }) {
  const gs = useMemo(
    () =>
      mergeGlobalStylePaper(
        defaultResume.globalStyle as GlobalStyle,
        (config.globalStyle ?? {}) as Partial<GlobalStyle>,
      ),
    [config],
  );
  const pages = useMemo(() => {
    const list = Array.isArray(config.pages) ? config.pages : [];
    return list.map((page, idx) => {
      const modules = (page as { modules?: unknown[] })?.modules ?? [];
      const { main, sideSlot } = renderResumePageModules(modules, gs, {
        isFirstPage: idx === 0,
      });
      return (
        <div
          key={`cfg-preview-page-${idx}`}
          className='shrink-0 overflow-hidden rounded-[2px] border border-[color:var(--editor-shell-border)] shadow-[0_12px_28px_rgba(0,0,0,0.12)]'
          style={{ colorScheme: 'light' }}
        >
          <Page {...gs} firstPage={idx === 0} sideSlot={idx === 0 ? sideSlot ?? undefined : undefined}>
            {main}
          </Page>
        </div>
      );
    });
  }, [config, gs]);

  return (
    <>
      <ResumeFontCdn font={gs.resumeFont} />
      {pages}
    </>
  );
}

function ResumeConfigCanvasPreviewHost() {
  const tc = useTranslations('Edit.canvas');
  const { open, closing, title, config } = resumePreviewStore;
  return (
    <CanvasPreviewOverlay
      open={open}
      closing={closing}
      title={title || tc('textPreview')}
      closeAria={tc('closePreview')}
      onClose={() => resumePreviewStore.requestClose()}
    >
      {config ? <ResumeConfigPreviewPages config={config as Record<string, unknown>} /> : null}
    </CanvasPreviewOverlay>
  );
}

export default memo(observer(ResumeConfigCanvasPreviewHost));
