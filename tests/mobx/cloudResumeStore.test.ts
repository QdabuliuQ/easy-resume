import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import defaultResume from '@/json/resume.defaults';
import { configStore, cloudResumeStore } from '@/mobx';

const STORAGE_KEY = 'easy-resume-cloud-id';

function cloneResume() {
  return JSON.parse(JSON.stringify(defaultResume));
}

function jsonRes(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

function lastSaveBody() {
  return JSON.parse((vi.mocked(fetch).mock.calls.at(-1)?.[1] as RequestInit).body as string);
}

describe('cloudResumeStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    cloudResumeStore.markAsNew();
    configStore.setConfig(cloneResume(), { source: 'hydrate' });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cloudResumeStore.markAsNew();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('showSaveButton is true when unbound', () => {
    expect(cloudResumeStore.showSaveButton).toBe(true);
    expect(cloudResumeStore.statusLabel).toBe('idle');
  });

  it('bindId persists id and flips save button off', () => {
    cloudResumeStore.bindId('r1');
    expect(cloudResumeStore.resumeId).toBe('r1');
    expect(cloudResumeStore.showSaveButton).toBe(false);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('r1');
    expect(cloudResumeStore.statusLabel).toBe('saved');
  });

  it('save fails without config content', async () => {
    configStore.setConfig(null as any, { source: 'hydrate' });
    const r = await cloudResumeStore.save();
    expect(r).toEqual({ ok: false, error: '无简历内容' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('save creates resume and binds id', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(await jsonRes({ id: 'new-id' }));
    const r = await cloudResumeStore.save();
    expect(r).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      '/api/resume/cloud',
      expect.objectContaining({ method: 'POST' }),
    );
    const body = lastSaveBody();
    expect(body.id).toBeUndefined();
    expect(body.content).toEqual(configStore.getConfig);
    expect(cloudResumeStore.resumeId).toBe('new-id');
    expect(cloudResumeStore.saving).toBe(false);
    expect(cloudResumeStore.showSaveButton).toBe(false);
  });

  it('save updates existing resume with id', async () => {
    cloudResumeStore.bindId('exist');
    vi.mocked(fetch).mockResolvedValueOnce(await jsonRes({ id: 'exist' }));
    const r = await cloudResumeStore.save();
    expect(r.ok).toBe(true);
    expect(lastSaveBody()).toEqual({
      content: configStore.getConfig,
      id: 'exist',
    });
  });

  it('save records API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(await jsonRes({ error: '请先登录 GitHub' }, 401));
    const r = await cloudResumeStore.save();
    expect(r).toEqual({ ok: false, error: '请先登录 GitHub' });
    expect(cloudResumeStore.lastError).toBe('请先登录 GitHub');
    expect(cloudResumeStore.statusLabel).toBe('error');
    expect(cloudResumeStore.saving).toBe(false);
  });

  it('save records network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    const r = await cloudResumeStore.save();
    expect(r).toEqual({ ok: false, error: 'offline' });
    expect(cloudResumeStore.lastError).toBe('offline');
  });

  it('autosaves after bind when config writes', async () => {
    vi.useFakeTimers();
    cloudResumeStore.bindId('auto');
    vi.mocked(fetch).mockResolvedValue(await jsonRes({ id: 'auto' }));
    cloudResumeStore.onConfigWrite('user');
    expect(fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(900);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('does not autosave when unbound', () => {
    vi.useFakeTimers();
    cloudResumeStore.onConfigWrite('user');
    vi.advanceTimersByTime(2000);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reset source clears bound id', () => {
    cloudResumeStore.bindId('x');
    cloudResumeStore.onConfigWrite('reset');
    expect(cloudResumeStore.resumeId).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('openResume hydrates config and binds id', async () => {
    const content = cloneResume();
    content.name = 'cloud';
    vi.mocked(fetch).mockResolvedValueOnce(await jsonRes({ content }));
    const r = await cloudResumeStore.openResume('oid');
    expect(r).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith('/api/resume/cloud/oid', { cache: 'no-store' });
    expect(configStore.getConfig.name).toBe('cloud');
    expect(cloudResumeStore.resumeId).toBe('oid');
  });

  it('openResume fails on empty content', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(await jsonRes({}));
    const r = await cloudResumeStore.openResume('oid');
    expect(r).toEqual({ ok: false, error: '简历内容为空' });
  });

  it('deleteResume clears active id and bumps list', async () => {
    cloudResumeStore.bindId('del');
    const epoch = cloudResumeStore.listEpoch;
    vi.mocked(fetch).mockResolvedValueOnce(await jsonRes({ ok: true }));
    const r = await cloudResumeStore.deleteResume('del');
    expect(r).toEqual({ ok: true });
    expect(cloudResumeStore.resumeId).toBeNull();
    expect(cloudResumeStore.listEpoch).toBe(epoch + 1);
  });
});
