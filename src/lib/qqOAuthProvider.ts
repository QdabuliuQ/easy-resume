import type { OAuthConfig } from '@auth/core/providers';

type QqProfile = {
  openid?: string;
  nickname?: string;
  figureurl_qq_2?: string;
  figureurl_qq_1?: string;
  figureurl_2?: string;
  figureurl?: string;
  ret?: number;
  msg?: string;
};

function parseQqPayload(text: string): Record<string, string> {
  const trimmed = text.trim();
  const jsonp = trimmed.match(/^[^(]+\(([\s\S]*)\)\s*;?\s*$/);
  if (jsonp?.[1]) {
    try {
      return JSON.parse(jsonp[1]) as Record<string, string>;
    } catch {
      /* fallthrough */
    }
  }
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed) as Record<string, string>;
    } catch {
      /* fallthrough */
    }
  }
  const out: Record<string, string> = {};
  new URLSearchParams(trimmed).forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

/** QQ 互联（网站应用）；回调：{AUTH_BASE_PATH}/callback/qq */
export function QqProvider(options?: {
  clientId?: string;
  clientSecret?: string;
}): OAuthConfig<QqProfile> {
  const clientId = options?.clientId || process.env.AUTH_QQ_ID || '';
  const clientSecret = options?.clientSecret || process.env.AUTH_QQ_SECRET || '';
  return {
    id: 'qq',
    name: 'QQ',
    type: 'oauth',
    clientId,
    clientSecret,
    // ponytail: 与 GitHub 一致，反代下避免 state cookie 丢失
    checks: [],
    authorization: {
      url: 'https://graph.qq.com/oauth2.0/authorize',
      params: { scope: 'get_user_info', response_type: 'code' },
    },
    token: {
      url: 'https://graph.qq.com/oauth2.0/token',
      async request({ provider, params }) {
        const tokenUrl = new URL('https://graph.qq.com/oauth2.0/token');
        tokenUrl.searchParams.set('grant_type', 'authorization_code');
        tokenUrl.searchParams.set('client_id', String(provider.clientId || ''));
        tokenUrl.searchParams.set('client_secret', String(provider.clientSecret || ''));
        tokenUrl.searchParams.set('code', String(params.code || ''));
        tokenUrl.searchParams.set('redirect_uri', String(params.redirect_uri || ''));
        const tokenRes = await fetch(tokenUrl);
        const tokenData = parseQqPayload(await tokenRes.text());
        if (!tokenData.access_token) {
          throw new Error(tokenData.error_description || tokenData.error || 'QQ 换取 access_token 失败');
        }
        const meUrl = new URL('https://graph.qq.com/oauth2.0/me');
        meUrl.searchParams.set('access_token', tokenData.access_token);
        const meRes = await fetch(meUrl);
        const meData = parseQqPayload(await meRes.text());
        if (!meData.openid) {
          throw new Error(meData.error_description || meData.error || 'QQ 获取 openid 失败');
        }
        return {
          tokens: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: Number(tokenData.expires_in) || undefined,
            openid: meData.openid,
          },
        };
      },
    },
    userinfo: {
      url: 'https://graph.qq.com/user/get_user_info',
      async request({ tokens, provider }) {
        const openid = String((tokens as { openid?: string }).openid || '');
        const url = new URL('https://graph.qq.com/user/get_user_info');
        url.searchParams.set('access_token', String(tokens.access_token || ''));
        url.searchParams.set('oauth_consumer_key', String(provider.clientId || ''));
        url.searchParams.set('openid', openid);
        const res = await fetch(url);
        const profile = (await res.json()) as QqProfile;
        if (profile.ret != null && Number(profile.ret) !== 0) {
          throw new Error(profile.msg || 'QQ 获取用户信息失败');
        }
        return { ...profile, openid };
      },
    },
    profile(profile) {
      return {
        id: String(profile.openid || ''),
        name: profile.nickname || 'QQ用户',
        email: null,
        image:
          profile.figureurl_qq_2 ||
          profile.figureurl_qq_1 ||
          profile.figureurl_2 ||
          profile.figureurl ||
          null,
        login: profile.nickname || undefined,
      };
    },
    style: { brandColor: '#12B7F5' },
  };
}
