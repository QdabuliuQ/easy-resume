import { makeAutoObservable, runInAction } from 'mobx';
import { configStore } from '@/mobx/configStore';
import editHistoryStore from '@/mobx/editHistoryStore';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';

const STORAGE_KEY = 'easy-resume-cloud-id';
const AUTOSAVE_MS = 900;

class CloudResumeStore {
  /** 已云端保存的简历 id；为空则显示「保存」按钮 */
  resumeId: string | null = null;
  saving = false;
  lastError = '';
  lastSavedAt: number | null = null;
  /** 变更后「我的简历」列表刷新 */
  listEpoch = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private seq = 0;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    if (typeof window !== 'undefined') {
      try {
        const id = sessionStorage.getItem(STORAGE_KEY);
        if (id) this.resumeId = id;
      } catch {
        /* ignore */
      }
    }
  }

  get showSaveButton() {
    return !this.resumeId;
  }

  get statusLabel() {
    if (this.saving) return 'saving';
    if (this.lastError) return 'error';
    if (this.resumeId && this.lastSavedAt) return 'saved';
    return 'idle';
  }

  bumpList() {
    this.listEpoch += 1;
  }

  markAsNew() {
    this.clearTimer();
    this.resumeId = null;
    this.lastError = '';
    this.lastSavedAt = null;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  bindId(id: string) {
    this.persistId(id);
    this.lastError = '';
    this.lastSavedAt = Date.now();
  }

  private persistId(id: string) {
    this.resumeId = id;
    try {
      sessionStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** 配置写入后：新简历不自动存；已绑定 id 则 debounce 自动保存 */
  onConfigWrite(source?: string) {
    if (source === 'reset') {
      this.markAsNew();
      return;
    }
    if (source === 'hydrate') return;
    if (!this.resumeId) return;
    this.scheduleAutosave();
  }

  scheduleAutosave() {
    if (!this.resumeId) return;
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.save({ silent: true });
    }, AUTOSAVE_MS);
  }

  /** 打开云端简历到编辑器 */
  async openResume(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/resume/cloud/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data?.error || '加载失败' };
      const content = data?.content;
      if (!content) return { ok: false, error: '简历内容为空' };
      editHistoryStore.clear();
      configStore.setConfig(JSON.parse(JSON.stringify(content)), { source: 'hydrate' });
      resetAiModifyChatSession();
      this.bindId(id);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : '网络错误' };
    }
  }

  async deleteResume(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/resume/cloud?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data?.error || '删除失败' };
      if (this.resumeId === id) this.markAsNew();
      this.bumpList();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : '网络错误' };
    }
  }

  async save(opts?: { silent?: boolean }): Promise<{ ok: boolean; error?: string }> {
    const content = configStore.getConfig;
    if (!content) return { ok: false, error: '无简历内容' };
    const silent = opts?.silent === true;

    this.clearTimer();
    const mySeq = ++this.seq;
    const wasNew = !this.resumeId;
    runInAction(() => {
      if (!silent) this.saving = true;
      this.lastError = '';
    });

    try {
      const res = await fetch('/api/resume/cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          ...(this.resumeId ? { id: this.resumeId } : {}),
        }),
      });
      const data = await res.json();
      if (mySeq !== this.seq) return { ok: false };

      if (!res.ok) {
        const error = data?.error || '保存失败';
        runInAction(() => {
          this.saving = false;
          this.lastError = error;
        });
        return { ok: false, error };
      }

      const id = data?.id ? String(data.id) : '';
      runInAction(() => {
        this.saving = false;
        this.lastError = '';
        this.lastSavedAt = Date.now();
        if (id) this.persistId(id);
        if (wasNew) this.bumpList();
        else this.bumpList();
      });
      return { ok: true };
    } catch (e) {
      if (mySeq !== this.seq) return { ok: false };
      const error = e instanceof Error ? e.message : '网络错误';
      runInAction(() => {
        this.saving = false;
        this.lastError = error;
      });
      return { ok: false, error };
    }
  }
}

const cloudResumeStore = new CloudResumeStore();
export default cloudResumeStore;
export { cloudResumeStore };
