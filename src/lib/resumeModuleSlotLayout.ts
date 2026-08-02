import type { CSSProperties } from 'react';

/** 分页槽位：仅跨页裁剪/续页偏移时需要固定高度，完整模块用 auto 避免 PDF 与测量高度不一致产生空隙 */
export function resumeModuleSlotStyle(opts: {
  viewHeight: number;
  offsetY?: number;
  measuredModuleHeight?: number;
}): CSSProperties {
  const { viewHeight, offsetY = 0, measuredModuleHeight: mh } = opts;
  const contentLeft = mh == null ? viewHeight : Math.max(0, mh - offsetY);
  const needsClip = contentLeft > viewHeight + 0.5;
  const needsFixedHeight = offsetY > 0 || needsClip;
  return {
    height: needsFixedHeight ? viewHeight : undefined,
    overflow: needsClip ? 'hidden' : 'visible',
    flexShrink: 0,
  };
}
