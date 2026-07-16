import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const auth = vi.fn();

vi.mock('@/auth', () => ({
  auth: () => auth(),
}));

import { DELETE, GET, POST } from '@/app/api/resume/cloud/route';

function jsonRes(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

async function mustRes(r: Response | undefined | void | Promise<Response | undefined | void>) {
  const res = await r;
  if (!res) throw new Error('expected Response');
  return res;
}

describe('/api/resume/cloud', () => {
  beforeEach(() => {
    auth.mockReset();
    vi.stubGlobal('fetch', vi.fn());
    process.env.CF_API_BASE_URL = 'https://cf.example';
    process.env.CF_API_SECRET = 'test-cf-secret';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.CF_API_BASE_URL;
    delete process.env.CF_API_SECRET;
  });

  it('GET returns 401 when not logged in', async () => {
    auth.mockResolvedValue(null);
    const res = await mustRes(GET());
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: '请先登录 GitHub' });
  });

  it('GET returns 503 without CF_API_BASE_URL', async () => {
    auth.mockResolvedValue({ user: { uid: 'u1' } });
    delete process.env.CF_API_BASE_URL;
    const res = await mustRes(GET());
    expect(res.status).toBe(503);
  });

  it('GET returns 503 without CF_API_SECRET', async () => {
    auth.mockResolvedValue({ user: { uid: 'u1' } });
    delete process.env.CF_API_SECRET;
    const res = await mustRes(GET());
    expect(res.status).toBe(503);
  });

  it('GET lists resumes for uid with service key', async () => {
    auth.mockResolvedValue({ user: { uid: 'u1' } });
    vi.mocked(fetch).mockResolvedValueOnce(await jsonRes({ items: [] }));
    const res = await mustRes(GET());
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      'https://cf.example/api/resume/list?uid=u1',
      expect.objectContaining({
        cache: 'no-store',
        headers: expect.objectContaining({ 'X-CF-Key': 'test-cf-secret' }),
      }),
    );
  });

  it('POST returns 401 when not logged in', async () => {
    auth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/resume/cloud', {
      method: 'POST',
      body: JSON.stringify({ content: {} }),
    });
    const res = await mustRes(POST(req));
    expect(res.status).toBe(401);
  });

  it('POST returns 400 without content', async () => {
    auth.mockResolvedValue({ user: { uid: 'u1' } });
    const req = new NextRequest('http://localhost/api/resume/cloud', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await mustRes(POST(req));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: '缺少 content' });
  });

  it('POST proxies save with uid and service key', async () => {
    auth.mockResolvedValue({ user: { uid: 'u1' } });
    vi.mocked(fetch).mockResolvedValueOnce(await jsonRes({ id: 'r1' }));
    const req = new NextRequest('http://localhost/api/resume/cloud', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { name: 'x' }, id: 'r1' }),
    });
    const res = await mustRes(POST(req));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: 'r1' });
    expect(fetch).toHaveBeenCalledWith(
      'https://cf.example/api/resume/save',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ uid: 'u1', content: { name: 'x' }, id: 'r1' }),
        headers: expect.objectContaining({ 'X-CF-Key': 'test-cf-secret' }),
      }),
    );
  });

  it('DELETE requires id', async () => {
    auth.mockResolvedValue({ user: { uid: 'u1' } });
    const req = new NextRequest('http://localhost/api/resume/cloud', { method: 'DELETE' });
    const res = await mustRes(DELETE(req));
    expect(res.status).toBe(400);
  });

  it('DELETE proxies remove with service key', async () => {
    auth.mockResolvedValue({ user: { uid: 'u1' } });
    vi.mocked(fetch).mockResolvedValueOnce(await jsonRes({ ok: true }));
    const req = new NextRequest('http://localhost/api/resume/cloud?id=r1', {
      method: 'DELETE',
    });
    const res = await mustRes(DELETE(req));
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      'https://cf.example/api/resume/remove?id=r1&uid=u1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({ 'X-CF-Key': 'test-cf-secret' }),
      }),
    );
  });
});
