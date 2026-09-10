/** 字段选中时抑制「模块整块滚动」，避免先滚模块再滚字段的二次调整 */
let skipPanelModuleSectionUntil = 0;

export function armSkipPanelModuleSectionScroll(ms = 500) {
  skipPanelModuleSectionUntil = performance.now() + ms;
}

export function shouldSkipPanelModuleSectionScroll() {
  return performance.now() < skipPanelModuleSectionUntil;
}

/** 同一字段短时间内只滚一次 canvas，避免 click 与 panel focusin 各滚一次 */
let canvasFieldId = '';
let canvasFieldUntil = 0;

export function markCanvasFieldCentered(itemId: string, ms = 600) {
  canvasFieldId = itemId;
  canvasFieldUntil = performance.now() + ms;
}

export function shouldSkipCanvasFieldCenter(itemId: string) {
  return itemId === canvasFieldId && performance.now() < canvasFieldUntil;
}
