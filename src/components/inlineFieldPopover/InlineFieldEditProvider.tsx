'use client';
import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { configStore } from '@/mobx';
import { flattenModules } from '@/utils/resumePages';
import { parseItemTargetFromItemId } from '@/lib/inlineFieldEdit/parseItemTarget';
import {
  computePopoverPosition,
  resolvePopoverAnchorRect,
  type PopoverPosition,
} from '@/lib/inlineFieldEdit/computePopoverPosition';
import { popoverSizeForKind, resolveFieldMeta } from '@/lib/inlineFieldEdit/resolveFieldMeta';
import InlineFieldEditor from '@/components/inlineFieldPopover/InlineFieldEditor';
import CanvasFieldHighlight from '@/components/inlineFieldPopover/CanvasFieldHighlight';
import styles from '@/components/inlineFieldPopover/inlineFieldPopover.module.css';

type OpenPayload = { itemId: string; anchorEl: HTMLElement };

type InlineFieldEditContextValue = {
  open: (payload: OpenPayload) => void;
  close: () => void;
};

const InlineFieldEditContext = createContext<InlineFieldEditContextValue | null>(null);

export function useInlineFieldEdit() {
  const ctx = useContext(InlineFieldEditContext);
  if (!ctx) throw new Error('useInlineFieldEdit must be used within InlineFieldEditProvider');
  return ctx;
}

export function useOptionalInlineFieldEdit() {
  return useContext(InlineFieldEditContext);
}

export function InlineFieldEditProvider({
  containerRef,
  enabled = true,
  children,
}: {
  containerRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<OpenPayload | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<PopoverPosition | null>(null);

  const close = useCallback(() => setActive(null), []);

  const open = useCallback((payload: OpenPayload) => {
    setActive((prev) =>
      prev?.itemId === payload.itemId && prev.anchorEl === payload.anchorEl ? null : payload,
    );
  }, []);

  const ctx = useMemo(() => ({ open, close }), [open, close]);

  const resolved = useMemo(() => {
    if (!active) return null;
    const moduleIds = flattenModules(configStore.getConfig).map((m) => m.id);
    const target = parseItemTargetFromItemId(active.itemId, moduleIds);
    if (!target?.field) return null;
    const moduleType =
      flattenModules(configStore.getConfig).find((m) => m.id === target.moduleId)?.type ?? '';
    const meta = resolveFieldMeta(moduleType, target);
    if (!meta) return null;
    return { ...active, target, meta };
  }, [active]);

  const reposition = useCallback(() => {
    const container = containerRef.current;
    if (!container || !active?.anchorEl || !resolved) {
      setPos(null);
      return;
    }
    const anchor = resolvePopoverAnchorRect(active.anchorEl, container);
    const size = popoverSizeForKind(resolved.meta.kind);
    const measured = popoverRef.current?.getBoundingClientRect();
    const height = measured?.height && measured.height > 1 ? measured.height : size.height;
    setPos(computePopoverPosition(anchor, container, size.width, height));
  }, [active, containerRef, resolved]);

  useLayoutEffect(() => {
    if (!enabled || !active?.anchorEl || !resolved) {
      setPos(null);
      return;
    }
    reposition();
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      reposition();
      raf2 = requestAnimationFrame(reposition);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [active?.anchorEl, active?.itemId, enabled, reposition, resolved]);

  useEffect(() => {
    const el = popoverRef.current;
    if (!el || !active) return;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => reposition()) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [active, reposition, resolved?.itemId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !active) return;
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
  }, [active, containerRef, reposition]);

  useEffect(() => {
    if (!enabled) close();
  }, [enabled, close]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t)) return;
      if (active.anchorEl.contains(t)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [active, close]);

  const popoverSize = resolved ? popoverSizeForKind(resolved.meta.kind) : null;

  return (
    <InlineFieldEditContext.Provider value={ctx}>
      {children}
      {resolved && enabled && active?.anchorEl ? (
        <CanvasFieldHighlight
          containerRef={containerRef}
          anchorEl={active.anchorEl}
          itemKey={resolved.itemId}
        />
      ) : null}
      {resolved && enabled && active?.anchorEl && popoverSize ? (
        <div
          key={resolved.itemId}
          ref={popoverRef}
          className={`${styles.popover} ${pos ? (pos.placement === 'below' ? styles.enterBelow : styles.enterAbove) : ''}`}
          style={{
            top: pos?.top ?? 0,
            left: pos?.left ?? 0,
            width: pos?.width ?? popoverSize.width,
            visibility: pos ? 'visible' : 'hidden',
            pointerEvents: pos ? 'auto' : 'none',
          }}
          data-resume-export-ignore
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <InlineFieldEditor
            itemId={resolved.itemId}
            target={resolved.target}
            meta={resolved.meta}
            width={pos?.width ?? popoverSize.width}
            onRequestClose={close}
          />
        </div>
      ) : null}
    </InlineFieldEditContext.Provider>
  );
}

export default memo(InlineFieldEditProvider);
