import { useMemoizedFn } from 'ahooks';
import { useState, type RefObject } from 'react';
import { HIGHLIGHT_OUTSET_X } from '@/lib/inlineFieldEdit/computePopoverPosition';
import { visibleSelectableUnionRect } from '@/lib/resumeModuleSlotDom';

export type CanvasHoverRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

interface UseSelectableGuideHoverParams {
  containerRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
}

export function useSelectableGuideHover({
  containerRef,
  stageRef,
}: UseSelectableGuideHoverParams) {
  const [hoverRect, setHoverRect] = useState<CanvasHoverRect | null>(null);

  const updateSelectableHover = useMemoizedFn((clientX: number, clientY: number) => {
    const stageEl = stageRef.current;
    const containerEl = containerRef.current;
    if (!stageEl || !containerEl) {
      setHoverRect(null);
      return;
    }

    const stack = document.elementsFromPoint(clientX, clientY);
    const hit = stack.find((el) => {
      if (!(el instanceof HTMLElement)) return false;
      const selectableEl = el.closest("[data-selectable='true']");
      if (!(selectableEl instanceof HTMLElement)) return false;
      return stageEl.contains(selectableEl);
    });

    if (!(hit instanceof HTMLElement)) {
      setHoverRect(null);
      return;
    }

    const targetEl = hit.closest("[data-selectable='true']");
    if (!(targetEl instanceof HTMLElement)) {
      setHoverRect(null);
      return;
    }

    const union = visibleSelectableUnionRect(stageEl, targetEl);
    if (!union) {
      setHoverRect(null);
      return;
    }

    const containerRect = containerEl.getBoundingClientRect();
    const halfX = HIGHLIGHT_OUTSET_X / 2;
    const nextRect = {
      left: union.left - containerRect.left + containerEl.scrollLeft - halfX,
      top: union.top - containerRect.top + containerEl.scrollTop,
      width: union.width + HIGHLIGHT_OUTSET_X,
      height: union.height,
    };

    setHoverRect((prev) => {
      if (
        prev &&
        Math.abs(prev.left - nextRect.left) < 0.5 &&
        Math.abs(prev.top - nextRect.top) < 0.5 &&
        Math.abs(prev.width - nextRect.width) < 0.5 &&
        Math.abs(prev.height - nextRect.height) < 0.5
      ) {
        return prev;
      }
      return nextRect;
    });
  });

  const clearSelectableHover = useMemoizedFn(() => {
    setHoverRect(null);
  });

  return {
    hoverRect,
    updateSelectableHover,
    clearSelectableHover,
  };
}
