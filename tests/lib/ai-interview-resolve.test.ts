import { afterEach, describe, expect, it, vi } from 'vitest';

const loadCloudResumeForUid = vi.fn();
vi.mock('@/lib/ai/interview/loadResume', () => ({
  loadCloudResumeForUid: (...args: unknown[]) => loadCloudResumeForUid(...args),
}));

import { resolveInterviewResume } from '@/lib/ai/interview/resolveResume';

describe('resolveInterviewResume', () => {
  afterEach(() => {
    loadCloudResumeForUid.mockReset();
  });

  it('loads cloud resume by uid + resumeId', async () => {
    loadCloudResumeForUid.mockResolvedValueOnce({ resume: { name: '云端' } });
    const r = await resolveInterviewResume({
      uid: 'u1',
      isDev: false,
      resumeId: 'r1',
    });
    expect(r).toEqual({ resume: { name: '云端' }, resumeId: 'r1' });
    expect(loadCloudResumeForUid).toHaveBeenCalledWith('u1', 'r1');
  });

  it('rejects resume body when logged in outside local debug', async () => {
    const r = await resolveInterviewResume({
      uid: 'u1',
      isDev: false,
      resume: { pages: [] },
    });
    expect(r).toEqual({ error: '请选择云端已保存简历', status: 400 });
    expect(loadCloudResumeForUid).not.toHaveBeenCalled();
  });

  it('accepts resume body in local debug without login', async () => {
    const r = await resolveInterviewResume({
      isDev: true,
      resume: { pages: [1] },
    });
    expect(r).toEqual({ resume: { pages: [1] } });
  });

  it('rejects anonymous resume body in production', async () => {
    const r = await resolveInterviewResume({
      isDev: false,
      resume: { pages: [] },
    });
    expect(r).toEqual({ error: '请先登录', status: 401 });
  });

  it('returns 400 when logged in but no resume source', async () => {
    const r = await resolveInterviewResume({
      uid: 'u1',
      isDev: false,
    });
    expect(r).toEqual({ error: '请选择云端已保存简历', status: 400 });
  });
});
