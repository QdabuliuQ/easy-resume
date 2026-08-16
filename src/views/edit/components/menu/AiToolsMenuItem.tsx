'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip } from 'antd';
import MenuItemIcon from './menuItemIcon';
import { AiToolsPanel, isAiToolKey, type AiToolKey } from './AiToolsPanel';

const MENU_TILE_SIZE_PX = 68;
const EXIT_MS = 160;
const MENU_TILE_TRANSITION =
  'transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100';
const MENU_TILE_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-panel)]';
const menuTileClass = `relative isolate flex cursor-pointer select-none flex-col items-center justify-center gap-1 overflow-hidden rounded-xl py-2 text-[10px] leading-[1.2] ${MENU_TILE_TRANSITION} ${MENU_TILE_FOCUS}`;
const TILE_DEFAULT = [
  'border border-transparent',
  'bg-[rgb(var(--surface-fg-rgb)/0.055)]',
  'text-[var(--menu-icon-muted)]',
  'hover:bg-[rgb(var(--surface-fg-rgb)/0.085)]',
  'hover:text-[rgb(var(--surface-fg-rgb)/0.58)]',
  'active:scale-[0.98]',
].join(' ');
const TILE_SELECTED = [
  'z-[1]',
  'border border-[color:var(--color-primary)]',
  'bg-[color-mix(in_srgb,var(--color-primary)_11%,var(--editor-shell-panel-strong))]',
  'text-[color:var(--color-primary)]',
  'shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_14%,transparent),0_6px_18px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]',
  'hover:bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--editor-shell-panel-strong))]',
  'active:scale-[0.98]',
].join(' ');

type AiToolsMenuItemProps = {
  activeKey: string;
  label: string;
  titles: Record<AiToolKey, string>;
  descriptions: Record<AiToolKey, string>;
  needLoginLabel: string;
  interviewLocked: boolean;
  showHint: boolean;
  onSelectTool: (key: AiToolKey) => void;
};

export default function AiToolsMenuItem({
  activeKey,
  label,
  titles,
  descriptions,
  needLoginLabel,
  interviewLocked,
  showHint,
  onSelectTool,
}: AiToolsMenuItemProps) {
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoverCloseTimer = useRef<number>(0);
  const exitTimer = useRef<number>(0);
  const [present, setPresent] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const aiActive = isAiToolKey(activeKey);
  const tileCls = aiActive ? TILE_SELECTED : TILE_DEFAULT;
  const hintCls = showHint && !aiActive ? ' ui-hint-shimmer' : '';

  useEffect(() => setMounted(true), []);

  const updatePos = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelH = panelRef.current?.offsetHeight || 210;
    setPos({
      top: Math.max(8, Math.min(window.innerHeight - panelH - 8, r.top + r.height / 2 - panelH / 2)),
      left: r.right + 10,
    });
  }, []);

  const clearHoverClose = useCallback(() => {
    window.clearTimeout(hoverCloseTimer.current);
  }, []);

  const clearExit = useCallback(() => {
    window.clearTimeout(exitTimer.current);
  }, []);

  const beginClose = useCallback(() => {
    clearHoverClose();
    setVisible(false);
  }, [clearHoverClose]);

  const openNow = useCallback(() => {
    clearHoverClose();
    clearExit();
    updatePos();
    setPresent(true);
    setVisible(true);
  }, [clearHoverClose, clearExit, updatePos]);

  const scheduleClose = useCallback(() => {
    clearHoverClose();
    hoverCloseTimer.current = window.setTimeout(() => beginClose(), 140);
  }, [clearHoverClose, beginClose]);

  useEffect(() => {
    if (!present || visible) {
      clearExit();
      return;
    }
    exitTimer.current = window.setTimeout(() => setPresent(false), EXIT_MS);
    return () => clearExit();
  }, [present, visible, clearExit]);

  useLayoutEffect(() => {
    if (!present) return;
    updatePos();
    const id = requestAnimationFrame(() => updatePos());
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [present, visible, updatePos]);

  useEffect(
    () => () => {
      window.clearTimeout(hoverCloseTimer.current);
      window.clearTimeout(exitTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!present) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') beginClose();
    };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      beginClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [present, beginClose]);

  return (
    <div
      ref={wrapRef}
      className='relative'
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
      onFocusCapture={openNow}
    >
      <div
        data-edit-tour='menu-ai-tools'
        role='button'
        tabIndex={0}
        aria-haspopup='menu'
        aria-expanded={present && visible}
        aria-controls={panelId}
        aria-label={label}
        aria-current={aiActive ? 'page' : undefined}
        onClick={() => {
          if (present && visible) beginClose();
          else openNow();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (present && visible) beginClose();
            else openNow();
          }
        }}
        className={`${menuTileClass} ${tileCls}${hintCls}`}
        style={{ width: MENU_TILE_SIZE_PX, height: MENU_TILE_SIZE_PX }}
      >
        <MenuItemIcon menuKey='ai-tools' selected={aiActive} />
        <span className='relative z-[1] max-w-[62px] px-0.5 text-center font-medium'>{label}</span>
      </div>

      {mounted && present
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              className='fixed z-[80] w-[228px]'
              style={{ top: pos.top, left: pos.left }}
              onMouseEnter={() => {
                clearHoverClose();
                clearExit();
                setVisible(true);
              }}
              onMouseLeave={scheduleClose}
            >
              <AiToolsPanel
                className={visible ? 'ai-tools-flyout-enter' : 'ai-tools-flyout-exit'}
                activeKey={activeKey}
                titles={titles}
                descriptions={descriptions}
                interviewLocked={interviewLocked}
                onSelect={(key) => {
                  if (key === 'ai-interview' && interviewLocked) return;
                  onSelectTool(key);
                  beginClose();
                }}
                footer={
                  interviewLocked ? (
                    <div className='border-t border-fg/[0.06] px-3 py-2'>
                      <Tooltip title={needLoginLabel} placement='right'>
                        <p className='text-[10px] leading-snug text-fg/40'>{needLoginLabel}</p>
                      </Tooltip>
                    </div>
                  ) : null
                }
              />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
