import { describe, expect, it } from 'vitest';
import { QqProvider } from '@/lib/qqOAuthProvider';

describe('QqProvider', () => {
  it('exposes qq oauth endpoints and profile mapper', () => {
    const p = QqProvider({ clientId: 'app', clientSecret: 'key' });
    expect(p.id).toBe('qq');
    expect(p.type).toBe('oauth');
    expect(p.clientId).toBe('app');
    expect(typeof p.token).toBe('object');
    expect(typeof p.userinfo).toBe('object');
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
});
