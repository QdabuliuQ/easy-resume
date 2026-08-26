'use client';
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type RefObject,
} from 'react';
import {
  computeAnchorHighlightRectFromElement,
  type AnchorHighlightRect,
} from '@/lib/inlineFieldEdit/computePopoverPosition';
import styles from '@/components/inlineFieldPopover/inlineFieldPopover.module.css';

export function CanvasFieldHighlight({
  containerRef,
  anchorEl,
  itemKey,
}: {
  containerRef: RefObject<HTMLElement | null>;
  anchorEl: HTMLElement | null;
  itemKey?: string;
}) {
  const [rect, setRect] = useState<AnchorHighlightRect | null>(null);

  const reposition = useCallback(() => {
    const container = containerRef.current;
    if (!container || !anchorEl) {
      setRect(null);
      return;
    }
    setRect(computeAnchorHighlightRectFromElement(anchorEl, container));
  }, [anchorEl, containerRef]);

  useLayoutEffect(() => {
    reposition();
  }, [reposition, itemKey, anchorEl]);

  useEffect(() => {
    if (!anchorEl) return;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => reposition()) : null;
    ro?.observe(anchorEl);
    return () => ro?.disconnect();
  }, [anchorEl, reposition, itemKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !anchorEl) return;
    const onMove = () => reposition();
    container.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', onMove);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onMove) : null;
    ro?.observe(container);
    return () => {
      container.removeEventListener('scroll', onMove);
      window.removeEventListener('resize', onMove);
      ro?.disconnect();
    };
  }, [anchorEl, containerRef, reposition]);

  if (!rect || !anchorEl) return null;

  return (
    <div
      key={itemKey}
      className={styles.fieldHighlight}
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
      data-resume-export-ignore
      aria-hidden
    />
  );
}

export default memo(CanvasFieldHighlight);
