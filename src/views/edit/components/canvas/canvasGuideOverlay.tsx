'use client';
import { useEffect, useState, type RefObject } from 'react';
import { useMemoizedFn } from 'ahooks';
import SelectableGuideLines from './selectableGuideLines';
import { useSelectableGuideHover } from './useSelectableGuideHover';

type CanvasGuideOverlayProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  active: boolean;
};

/** Owns scroll/hover state so Canvas body does not re-render on pointer move. */
export default function CanvasGuideOverlay({
  containerRef,
  stageRef,
  active,
}: CanvasGuideOverlayProps) {
  const { hoverRect, updateSelectableHover, clearSelectableHover } =
    useSelectableGuideHover({ containerRef, stageRef });
  const [guideViewport, setGuideViewport] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const updateGuideViewport = useMemoizedFn(() => {
    const el = containerRef.current;
    if (!el) return;
    setGuideViewport({
      left: el.scrollLeft,
      top: el.scrollTop,
      width: el.clientWidth,
      height: el.clientHeight,
    });
  });

  useEffect(() => {
    if (!active) {
      clearSelectableHover();
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const onMove = (event: MouseEvent) =>
      updateSelectableHover(event.clientX, event.clientY);
    const onLeave = () => clearSelectableHover();
    const onScroll = () => updateGuideViewport();
    updateGuideViewport();
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateGuideViewport())
        : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      el.removeEventListener('scroll', onScroll);
      ro?.disconnect();
      clearSelectableHover();
    };
  }, [
    active,
    containerRef,
    clearSelectableHover,
    updateGuideViewport,
    updateSelectableHover,
  ]);

  if (!active) return null;

  return (
    <SelectableGuideLines
      hoverRect={hoverRect}
      visible={Boolean(hoverRect)}
      viewport={guideViewport}
    />
  );
}
