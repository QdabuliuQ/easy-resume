import { describe, expect, it, vi, afterEach } from 'vitest';
import { customFetch } from '@auth/core';
import { QqProvider } from '@/lib/qqOAuthProvider';

describe('QqProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('exposes qq oauth endpoints and profile mapper', () => {
    const p = QqProvider({ clientId: 'app', clientSecret: 'key' });
    expect(p.id).toBe('qq');
    expect(p.type).toBe('oauth');
    expect(p.clientId).toBe('app');
    expect(typeof p.token).toBe('object');
    expect(typeof p.userinfo).toBe('object');
    expect(p[customFetch]).toBeTypeOf('function');
    const user = p.profile!({
      openid: 'oid-1',
      nickname: '小明',
      figureurl_qq_2: 'https://thirdqq.qlogo.cn/a.png',
    });
    expect(user).toMatchObject({
      id: 'oid-1',
      name: '小明',
      login: '小明',
      image: 'https://thirdqq.qlogo.cn/a.png',
    });
  });

  it('customFetch rewrites QQ token GET into JSON bearer response', async () => {
    const p = QqProvider({ clientId: 'app', clientSecret: 'key' });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('access_token=tok-1&expires_in=3600&refresh_token=r1', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await p[customFetch]!(
      'https://graph.qq.com/oauth2.0/token',
      {
        method: 'POST',
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: 'abc',
          redirect_uri: 'https://resume.qdabuliuq.cn/api/auth/callback/qq',
          client_id: 'app',
          client_secret: 'key',
        }),
      },
    );
    const json = await res.json();
    expect(json).toMatchObject({
      access_token: 'tok-1',
      token_type: 'bearer',
      refresh_token: 'r1',
      expires_in: 3600,
    });
    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(calledUrl).toContain('graph.qq.com/oauth2.0/token');
    expect(calledUrl).toContain('code=abc');
    expect(calledUrl).toContain('grant_type=authorization_code');
  });
});
