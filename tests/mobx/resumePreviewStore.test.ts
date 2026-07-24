import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resumePreviewStore } from '@/mobx/resumePreviewStore';
import { PREVIEW_EXIT_MS } from '@/views/edit/components/canvas/canvasPreviewOverlay';

const sampleConfig = {
  name: '测试简历',
  globalStyle: { pageSize: 'A4' },
  pages: [{ modules: [] }],
};

function resetStore() {
  const store = resumePreviewStore as unknown as {
    closeTimer: ReturnType<typeof setTimeout> | null;
    open: boolean;
    closing: boolean;
    title: string;
    config: unknown | null;
  };
  if (store.closeTimer) {
    clearTimeout(store.closeTimer);
    store.closeTimer = null;
  }
  store.open = false;
  store.closing = false;
  store.title = '';
  store.config = null;
}

describe('resumePreviewStore', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    resetStore();
    vi.useRealTimers();
  });

  it('openWithConfig ignores empty config', () => {
    resumePreviewStore.openWithConfig(null, 'x');
    expect(resumePreviewStore.open).toBe(false);
    expect(resumePreviewStore.config).toBeNull();
  });

  it('openWithConfig stores title and config', () => {
    resumePreviewStore.openWithConfig(sampleConfig, '模板预览 · 前端');
    expect(resumePreviewStore.open).toBe(true);
    expect(resumePreviewStore.closing).toBe(false);
    expect(resumePreviewStore.title).toBe('模板预览 · 前端');
    expect(resumePreviewStore.config).toEqual(sampleConfig);
  });

  it('requestClose animates then clears', () => {
    vi.useFakeTimers();
    resumePreviewStore.openWithConfig(sampleConfig, '简历预览');
    resumePreviewStore.requestClose();
    expect(resumePreviewStore.open).toBe(true);
    expect(resumePreviewStore.closing).toBe(true);

    vi.advanceTimersByTime(PREVIEW_EXIT_MS);
    expect(resumePreviewStore.open).toBe(false);
    expect(resumePreviewStore.closing).toBe(false);
    expect(resumePreviewStore.config).toBeNull();
    expect(resumePreviewStore.title).toBe('');
  });

  it('requestClose is no-op when already closing', () => {
    vi.useFakeTimers();
    resumePreviewStore.openWithConfig(sampleConfig, 't');
    resumePreviewStore.requestClose();
    resumePreviewStore.requestClose();
    expect(resumePreviewStore.closing).toBe(true);
    vi.advanceTimersByTime(PREVIEW_EXIT_MS);
    expect(resumePreviewStore.open).toBe(false);
  });

  it('openWithConfig while closing replaces state', () => {
    vi.useFakeTimers();
    resumePreviewStore.openWithConfig(sampleConfig, '旧');
    resumePreviewStore.requestClose();
    const next = { ...sampleConfig, name: '新简历' };
    resumePreviewStore.openWithConfig(next, '新');
    expect(resumePreviewStore.open).toBe(true);
    expect(resumePreviewStore.closing).toBe(false);
    expect(resumePreviewStore.title).toBe('新');
    expect(resumePreviewStore.config).toEqual(next);
  });
});
