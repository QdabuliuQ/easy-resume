import { moduleActiveStore } from '@/mobx';
import { scrollElementIntoScrollParent } from '@/utils/scrollIntoScrollParent';
import type { ParsedItemTarget } from '@/lib/inlineFieldEdit/parseItemTarget';
import { focusFieldControlInHolder } from '@/lib/inlineFieldEdit/focusFieldControl';

export function focusPanelFieldByItemId(itemId: string) {
  const sel = `[data-panel-item-id="${CSS.escape(itemId)}"]`;

  const tryFocus = () => {
    const holder = document.querySelector(sel) as HTMLElement | null;
    if (!holder) return false;

    window.setTimeout(() => {
      scrollElementIntoScrollParent(holder, 'smooth', { align: 'center' });
      focusFieldControlInHolder(holder);
    }, 200);

    return true;
  };
  if (tryFocus()) return;
  let retries = 30;
  const tick = () => {
    if (tryFocus() || retries <= 0) return;
    retries -= 1;
    window.setTimeout(tick, 80);
  };
  window.setTimeout(tick, 80);
}

export function focusPanelByParsedTarget(itemId: string, target: ParsedItemTarget) {
  if (moduleActiveStore.getModuleActive !== target.moduleId) {
    moduleActiveStore.setModuleActive(target.moduleId);
  }
  requestAnimationFrame(() => focusPanelFieldByItemId(itemId));
}
