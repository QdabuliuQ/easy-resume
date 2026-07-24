'use client';

import { CloseOutlined } from '@ant-design/icons';
import { useMemoizedFn } from 'ahooks';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const PREVIEW_EXIT_MS = 200;

export function useCanvasPreviewOverlayState() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const openPreview = useMemoizedFn(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setClosing(false);
    setOpen(true);
  });

  const closePreview = useMemoizedFn(() => {
    if (!open || closing) return;
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
      closeTimerRef.current = null;
    }, PREVIEW_EXIT_MS);
  });

  return { open, closing, openPreview, closePreview };
}

type CanvasPreviewOverlayProps = {
  open: boolean;
  closing: boolean;
  title: string;
  closeAria: string;
  onClose: () => void;
  children: ReactNode;
};

/** 画布右下角「文本预览」同款全屏壳 */
export default function CanvasPreviewOverlay({
  open,
  closing,
  title,
  closeAria,
  onClose,
  children,
}: CanvasPreviewOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`${closing ? 'canvas-preview-overlay-exit-animate' : 'canvas-preview-overlay-animate'} canvas-preview-shell fixed inset-0 z-[1400] flex min-h-0 flex-col backdrop-blur-sm`}
    >
      <div className='canvas-preview-toolbar flex items-center justify-between px-5 py-3.5'>
        <span className='text-[13px] font-medium'>{title}</span>
        <button
          type='button'
          onClick={onClose}
          className='canvas-preview-close'
          aria-label={closeAria}
        >
          <CloseOutlined className='text-[12px]' />
        </button>
      </div>
      <div className='min-h-0 flex-1 overflow-auto px-5 py-5'>
        <div
          className={`${closing ? 'canvas-preview-content-exit-animate' : 'canvas-preview-content-animate'} mx-auto flex w-fit flex-col gap-[30px]`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
