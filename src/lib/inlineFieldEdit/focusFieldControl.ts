function placeCaretToEnd(el: HTMLElement) {
  if (!el.isContentEditable) return;
  const selApi = window.getSelection();
  if (!selApi) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  selApi.removeAllRanges();
  selApi.addRange(range);
}

function openAntdPopupIfNeeded(holder: HTMLElement, target: HTMLElement) {
  const root =
    (target.closest('.ant-select,.ant-picker,.ant-cascader') as HTMLElement | null) ??
    holder.querySelector('.ant-select,.ant-picker,.ant-cascader');
  if (!root) return;
  const trigger =
    (root.querySelector('.ant-select-selector') as HTMLElement | null) ??
    (root.querySelector('.ant-picker-input input') as HTMLElement | null) ??
    (root.querySelector('.ant-select-selection-search-input') as HTMLElement | null) ??
    (root.querySelector('input') as HTMLElement | null) ??
    root;
  if (typeof trigger.focus === 'function') trigger.focus();
  trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  trigger.click();
}

/** 在字段容器内聚焦可编辑控件；Ant Design 下拉/日期会顺带展开 */
export function focusFieldControlInHolder(
  holder: HTMLElement,
  opts?: { openAntdPopup?: boolean; focusIndex?: number },
): boolean {
  const focusIndex = opts?.focusIndex ?? 0;
  const controls = holder.querySelectorAll<HTMLElement>(
    'input,textarea,[contenteditable="true"],.ql-editor,.ant-select-selection-search-input',
  );
  const target =
    holder.matches('input,textarea,[contenteditable="true"]')
      ? holder
      : (controls[focusIndex] ?? controls[0] ?? null);
  if (!target) return false;
  if (typeof target.focus === 'function') target.focus();
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const len = target.value.length;
    target.setSelectionRange(len, len);
  } else {
    placeCaretToEnd(target);
  }
  if (opts?.openAntdPopup !== false) openAntdPopupIfNeeded(holder, target);
  return true;
}
