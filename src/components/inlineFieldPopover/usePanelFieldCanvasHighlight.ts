'use client';
import { useEffect, useState, type RefObject } from 'react';

const ANT_POPUP_SEL = '.ant-select-dropdown,.ant-picker-dropdown,.ant-cascader-dropdown,.ant-dropdown';

function resolveCanvasField(
  container: HTMLElement,
  itemId: string,
): HTMLElement | null {
  return container.querySelector(
    `[data-item-id="${CSS.escape(itemId)}"]`,
  ) as HTMLElement | null;
}

function panelFieldItemId(el: HTMLElement): string | null {
  const holder = el.closest('[data-panel-item-id]') as HTMLElement | null;
  return holder?.getAttribute('data-panel-item-id')?.trim() ?? null;
}

function isAntPopupFocus(el: HTMLElement): boolean {
  return Boolean(el.closest(ANT_POPUP_SEL));
}

function isResumePanelField(el: HTMLElement): boolean {
  return Boolean(el.closest('[data-panel-module-id]'));
}

/** 简历编辑面板聚焦时，高亮 canvas 上对应 data-item-id 字段 */
export function usePanelFieldCanvasHighlight(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [itemKey, setItemKey] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setAnchorEl(null);
      setItemKey(null);
      return;
    }

    const syncFromActive = () => {
      const container = containerRef.current;
      const active = document.activeElement;
      if (!container || !(active instanceof HTMLElement)) {
        setAnchorEl(null);
        setItemKey(null);
        return;
      }
      if (isAntPopupFocus(active)) return;
      if (!isResumePanelField(active)) {
        setAnchorEl(null);
        setItemKey(null);
        return;
      }
      const itemId = panelFieldItemId(active);
      if (!itemId) {
        setAnchorEl(null);
        setItemKey(null);
        return;
      }
      const canvasField = resolveCanvasField(container, itemId);
      setAnchorEl(canvasField);
      setItemKey(itemId);
    };

    const onFocusIn = (e: FocusEvent) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (isAntPopupFocus(t)) return;
      if (!isResumePanelField(t)) return;
      const container = containerRef.current;
      const itemId = panelFieldItemId(t);
      if (!container || !itemId) return;
      const canvasField = resolveCanvasField(container, itemId);
      setAnchorEl(canvasField);
      setItemKey(itemId);
    };

    const onFocusOut = () => {
      requestAnimationFrame(syncFromActive);
    };

    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
    syncFromActive();

    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('focusout', onFocusOut, true);
    };
  }, [containerRef, enabled]);

  return { anchorEl, itemKey };
}
