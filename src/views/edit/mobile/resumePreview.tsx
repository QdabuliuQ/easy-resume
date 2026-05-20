'use client';

import defaultResume from '@/json/resume.defaults';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Info1, Page } from '@/modules';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { configStore } from '@/mobx';
import CanvasModuleFragment from '@/views/edit/components/canvas/moduleFragment';
import ResumeFontCdn from '@/views/edit/components/canvas/ResumeFontCdn';
import { observer } from 'mobx-react';
import { memo, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

function renderPageModules(modules: unknown[], gs: GlobalStyle): ReactNode[] {
  const mm = Number(gs.moduleMargin) || 15;
  const out: ReactNode[] = [];
  let shellOrd = 0;
  modules.forEach((raw, i) => {
    const m = raw as { type?: string; id?: string; options?: Record<string, unknown> };
    if (!m?.type) return;
    if (i > 0) out.push(<div key={`sp-${m.id ?? i}`} style={{ height: mm, flexShrink: 0 }} aria-hidden />);
    if (m.type === 'info1') {
      out.push(<Info1 key={String(m.id ?? `info-${i}`)} config={m as never} globalStyle={gs} />);
      return;
    }
    shellOrd += 1;
    out.push(
      <CanvasModuleFragment
        key={String(m.id ?? `${m.type}-${i}`)}
        fragment={{
          type: m.type,
          sourceId: String(m.id ?? i),
          domId: String(m.id ?? i),
          showHeader: true,
          options: (m.options ?? {}) as Record<string, unknown>,
          sectionOrdinal: shellOrd,
        }}
        globalStyle={gs}
      />,
    );
  });
  return out;
}

const ResumePageFullBleed = memo(function ResumePageFullBleed({
  modules,
  globalStyle,
}: {
  modules: unknown[];
  globalStyle: GlobalStyle;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { width: pwStr, height: phStr } = globalStylePageDimensions(globalStyle);
  const pw = cssLengthToApproxPx(pwStr);
  const ph = cssLengthToApproxPx(phStr);
  const nodes = useMemo(() => renderPageModules(modules, globalStyle), [modules, globalStyle]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el || pw <= 0) return;
    const sync = () => setScale(el.clientWidth / pw);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pw]);

  return (
    <div
      ref={wrapRef}
      className='w-[100vw] max-w-[100vw] shrink-0 overflow-hidden bg-white shadow-[0_12px_40px_rgb(0_0_0/0.35)]'
      style={{ height: ph * scale, colorScheme: 'light' }}
    >
      <div
        className='origin-top-left text-left text-[#333] leading-normal'
        style={{
          transform: `scale(${scale})`,
          width: pwStr,
          height: phStr,
        }}
      >
        <ResumeFontCdn font={globalStyle.resumeFont} />
        <Page {...globalStyle}>
          {nodes}
        </Page>
      </div>
    </div>
  );
});

function MobileResumePreview() {
  const cfg = configStore.getConfig ?? defaultResume;
  const gs = configStore.mergedGlobalStyle as GlobalStyle;
  const pages = cfg.pages ?? [];

  if (!pages.length) {
    return (
      <div className='flex min-h-[40vh] w-[100vw] items-center justify-center px-6 text-sm text-fg/55'>
        —
      </div>
    );
  }

  return (
    <div className='flex w-[100vw] max-w-[100vw] flex-col items-center gap-4 py-4'>
      {pages.map((page, i) => (
        <ResumePageFullBleed
          key={page.id ?? `p-${i}`}
          modules={page.modules as unknown[]}
          globalStyle={gs}
        />
      ))}
    </div>
  );
}

export default memo(observer(MobileResumePreview));
