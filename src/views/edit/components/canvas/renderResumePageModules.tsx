'use client';
import { shouldPlaceInfo1InSideCol } from '@/lib/resumeSideColLayout';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Info1 } from '@/modules';
import CanvasModuleFragment from '@/views/edit/components/canvas/moduleFragment';
import type { ReactNode } from 'react';

export type ResumePageModulesSplit = {
  main: ReactNode[];
  sideSlot: ReactNode | null;
};

export function renderResumePageModules(
  modules: unknown[],
  gs: GlobalStyle,
  opts?: { isFirstPage?: boolean },
): ResumePageModulesSplit {
  const isFirstPage = opts?.isFirstPage !== false;
  const inSideCol = isFirstPage && shouldPlaceInfo1InSideCol(gs.layout);
  const mm = Number(gs.moduleMargin) || 15;
  const main: ReactNode[] = [];
  let sideSlot: ReactNode | null = null;
  let shellOrd = 0;
  modules.forEach((raw, i) => {
    const m = raw as { type?: string; id?: string; options?: Record<string, unknown> };
    if (!m?.type) return;
    if (m.type === 'info1') {
      const forceSideCol = inSideCol;
      const node = (
        <Info1
          key={String(m.id ?? `info-${i}`)}
          config={m as never}
          globalStyle={gs}
          forceSideCol={forceSideCol}
        />
      );
      if (inSideCol) sideSlot = node;
      else main.push(node);
      return;
    }
    if (main.length > 0) {
      main.push(
        <div key={`sp-${m.id ?? i}`} style={{ height: mm, flexShrink: 0 }} aria-hidden />,
      );
    }
    shellOrd += 1;
    main.push(
      <CanvasModuleFragment
        key={String(m.id ?? `${m.type}-${i}`)}
        fragment={{
          type: m.type,
          sourceId: String(m.id ?? i),
          domId: String(m.id ?? i),
          showHeader: true,
          selectable: false,
          options: (m.options ?? {}) as Record<string, unknown>,
          sectionOrdinal: shellOrd,
        }}
        globalStyle={gs}
      />,
    );
  });
  return { main, sideSlot };
}
