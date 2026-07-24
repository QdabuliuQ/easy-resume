import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PREVIEW_EXIT_MS,
  useCanvasPreviewOverlayState,
} from '@/views/edit/components/canvas/canvasPreviewOverlay';

describe('useCanvasPreviewOverlayState', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens immediately', () => {
    const { result } = renderHook(() => useCanvasPreviewOverlayState());
    act(() => result.current.openPreview());
    expect(result.current.open).toBe(true);
    expect(result.current.closing).toBe(false);
  });

  it('closes after exit animation', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCanvasPreviewOverlayState());
    act(() => result.current.openPreview());
    act(() => result.current.closePreview());
    expect(result.current.open).toBe(true);
    expect(result.current.closing).toBe(true);
    act(() => {
      vi.advanceTimersByTime(PREVIEW_EXIT_MS);
    });
    expect(result.current.open).toBe(false);
    expect(result.current.closing).toBe(false);
  });
});
