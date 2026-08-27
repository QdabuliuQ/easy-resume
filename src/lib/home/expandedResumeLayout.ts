import { parseTransformAngle, parseTransformTranslate } from '@/lib/home/parseTransformAngle';

export function computeExpandedTarget(
  pw: number,
  ph: number,
  viewW: number,
  viewH: number,
) {
  const padX = 48;
  const padY = 80;
  const scale = Math.min((viewW - padX) / pw, (viewH - padY) / ph, 1);
  return {
    width: pw * scale,
    height: ph * scale,
    scale,
  };
}

/** shell 负责 translate/rotate；cardWidth 驱动预览真实像素宽度 */
export type ExpandAnimFrame = {
  tx: number;
  ty: number;
  rot: number;
  cardWidth: number;
  shellH: number;
};

export type ExpandCaptureOffset = {
  left: number;
  top: number;
};

export function captureExpandFromPhysics(
  transform: string,
  cardWidth: number,
  shellH: number,
  offset: ExpandCaptureOffset = { left: 0, top: 0 },
): ExpandAnimFrame {
  const { tx, ty } = parseTransformTranslate(transform);
  return {
    tx: offset.left + tx,
    ty: offset.top + ty,
    rot: parseTransformAngle(transform),
    cardWidth,
    shellH,
  };
}

export function captureExpandFromLayout(
  el: HTMLElement,
  cardWidth: number,
  shellH: number,
): ExpandAnimFrame {
  const rect = el.getBoundingClientRect();
  return { tx: rect.left, ty: rect.top, rot: 0, cardWidth, shellH };
}

export function computeExpandToCenter(
  pw: number,
  ph: number,
  viewW: number,
  viewH: number,
  titleH: number,
): ExpandAnimFrame {
  const to = computeExpandedTarget(pw, ph, viewW, viewH);
  const shellH = to.height + titleH;
  return {
    tx: viewW / 2 - to.width / 2,
    ty: viewH / 2 - shellH / 2,
    rot: 0,
    cardWidth: to.width,
    shellH,
  };
}

export function applyPhysicsCloneTransform(
  shell: HTMLElement,
  frame: ExpandAnimFrame,
) {
  shell.style.width = `${frame.cardWidth}px`;
  shell.style.height = `${frame.shellH}px`;
  shell.style.transformOrigin = 'center center';
  shell.style.transform = `translate3d(${frame.tx}px, ${frame.ty}px, 0) rotate(${frame.rot}rad)`;
}

export function frameCenter(frame: ExpandAnimFrame) {
  return {
    cx: frame.tx + frame.cardWidth / 2,
    cy: frame.ty + frame.shellH / 2,
  };
}

export function frameFromCenter(
  cx: number,
  cy: number,
  rot: number,
  cardWidth: number,
  shellH: number,
): ExpandAnimFrame {
  return {
    tx: cx - cardWidth / 2,
    ty: cy - shellH / 2,
    rot,
    cardWidth,
    shellH,
  };
}

/** GSAP 可 tween 的中心点帧 */
export type ExpandAnimCenterState = {
  cx: number;
  cy: number;
  rot: number;
  cardWidth: number;
  shellH: number;
};

export function centerStateFromFrame(frame: ExpandAnimFrame): ExpandAnimCenterState {
  const { cx, cy } = frameCenter(frame);
  return { cx, cy, rot: frame.rot, cardWidth: frame.cardWidth, shellH: frame.shellH };
}

export function frameFromCenterState(state: ExpandAnimCenterState): ExpandAnimFrame {
  return frameFromCenter(state.cx, state.cy, state.rot, state.cardWidth, state.shellH);
}
