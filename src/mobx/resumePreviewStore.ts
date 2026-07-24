import { makeAutoObservable } from 'mobx';
import { PREVIEW_EXIT_MS } from '@/views/edit/components/canvas/canvasPreviewOverlay';

/** 模板 / 我的简历 → 复用画布文本预览壳 */
class ResumePreviewStore {
  open = false;
  closing = false;
  title = '';
  config: unknown | null = null;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private clearTimer() {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  openWithConfig(config: unknown, title: string) {
    if (!config) return;
    this.clearTimer();
    this.config = config;
    this.title = title;
    this.closing = false;
    this.open = true;
  }

  requestClose() {
    if (!this.open || this.closing) return;
    this.closing = true;
    this.closeTimer = setTimeout(() => {
      this.open = false;
      this.closing = false;
      this.config = null;
      this.title = '';
      this.closeTimer = null;
    }, PREVIEW_EXIT_MS);
  }
}

export const resumePreviewStore = new ResumePreviewStore();
