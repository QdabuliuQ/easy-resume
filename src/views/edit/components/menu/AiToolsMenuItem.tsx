'use client';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip } from 'antd';
import AiToolsIcon from './AiToolsIcon';
import { AiToolsPanel, isAiToolKey, type AiToolKey } from './AiToolsPanel';

const MENU_TILE_SIZE_PX = 68;
const EXIT_MS = 160;
const MENU_TILE_TRANSITION =
  'transition-[transform,box-shadow,background-color,color] duration-200 ease-out motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100';
const MENU_TILE_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(123_102_255/0.42)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-panel)]';
const menuTileClass = `relative isolate flex cursor-pointer select-none flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] leading-[1.2] ${MENU_TILE_TRANSITION} ${MENU_TILE_FOCUS}`;
const TILE_AI = ['z-[1]', 'ai-tools-tile', 'active:scale-[0.98]'].join(' ');
const TILE_AI_LIT = ['z-[1]', 'ai-tools-tile', 'ai-tools-tile-lit', 'active:scale-[0.98]'].join(' ');

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
  const lit = aiActive || present;
  const tileCls = lit ? TILE_AI_LIT : TILE_AI;
  const hintCls = showHint && !lit ? ' ui-hint-shimmer' : '';

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
        <AiToolsIcon size={24} gradient className='relative z-[1] mb-0.5 size-6 shrink-0' />
        <span className='ai-tools-tile-label relative z-[1] max-w-[62px] px-0.5 text-center font-medium'>
          {label}
        </span>
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
