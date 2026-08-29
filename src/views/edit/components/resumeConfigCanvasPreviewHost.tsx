'use client';

import { observer } from 'mobx-react';
import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import defaultResume from '@/json/resume.defaults';
import { resumePreviewStore } from '@/mobx/resumePreviewStore';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Page } from '@/modules';
import { flattenModules } from '@/utils/resumePages';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';
import ResumeFontCdn from '@/views/edit/components/canvas/resumeFontCdn';
import CanvasPreviewOverlay from '@/views/edit/components/canvas/canvasPreviewOverlay';

/** 与图片导出一致：展平模块 + continuous，避免按页高裁切看不到后半内容 */
function ResumeConfigPreviewPages({ config }: { config: Record<string, unknown> }) {
  const gs = useMemo(
    () =>
      mergeGlobalStylePaper(
        defaultResume.globalStyle as GlobalStyle,
        (config.globalStyle ?? {}) as Partial<GlobalStyle>,
      ),
    [config],
  );
  const modules = useMemo(() => flattenModules(config), [config]);
  const { main, sideSlot } = useMemo(
    () => renderResumePageModules(modules, gs, { isFirstPage: true }),
    [modules, gs],
  );

  return (
    <>
      <ResumeFontCdn font={gs.resumeFont} />
      <div
        className='shrink-0 overflow-hidden rounded-[2px] border border-[color:var(--editor-shell-border)] shadow-[0_12px_28px_rgba(0,0,0,0.12)]'
        style={{ colorScheme: 'light' }}
      >
        <Page {...gs} continuous firstPage sideSlot={sideSlot ?? undefined}>
          {main}
        </Page>
      </div>
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
