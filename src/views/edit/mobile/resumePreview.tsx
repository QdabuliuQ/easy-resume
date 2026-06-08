'use client';

import defaultResume from '@/json/resume.defaults';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Page } from '@/modules';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { configStore } from '@/mobx';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';
import ResumeFontCdn from '@/views/edit/components/canvas/resumeFontCdn';
import { observer } from 'mobx-react';
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react';

const ResumePageFullBleed = memo(function ResumePageFullBleed({
  modules,
  globalStyle,
  isFirstPage = true,
}: {
  modules: unknown[];
  globalStyle: GlobalStyle;
  isFirstPage?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { width: pwStr, height: phStr } = globalStylePageDimensions(globalStyle);
  const pw = cssLengthToApproxPx(pwStr);
  const ph = cssLengthToApproxPx(phStr);
  const { main, sideSlot } = useMemo(
    () =>
      renderResumePageModules(modules, globalStyle, {
        isFirstPage,
      }),
    [modules, globalStyle, isFirstPage],
  );

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
        <Page {...globalStyle} firstPage={isFirstPage} sideSlot={sideSlot ?? undefined}>
          {main}
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
          isFirstPage={i === 0}
        />
      ))}
    </div>
  );
}

export default memo(observer(MobileResumePreview));
