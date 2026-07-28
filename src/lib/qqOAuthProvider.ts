import type { OAuthConfig } from '@auth/core/providers';
import { customFetch } from '@auth/core';

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

async function readRequestParams(init?: RequestInit): Promise<URLSearchParams> {
  const body = init?.body;
  if (!body) return new URLSearchParams();
  if (typeof body === 'string') return new URLSearchParams(body);
  if (body instanceof URLSearchParams) return new URLSearchParams(body);
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const params = new URLSearchParams();
    body.forEach((v, k) => {
      if (typeof v === 'string') params.set(k, v);
    });
    return params;
  }
  return new URLSearchParams(String(body));
}

/**
 * Auth.js v5 不会调用 token.request，只会走 oauth4webapi 标准 POST。
 * QQ token 是 GET + form/jsonp，用 customFetch 拦截并改写成标准 JSON。
 */
function qqCustomFetch(clientId: string, clientSecret: string): typeof fetch {
  return async (input, init) => {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    if (!rawUrl.includes('graph.qq.com/oauth2.0/token')) {
      return fetch(input as RequestInfo, init);
    }

    const bodyParams = await readRequestParams(init);
    const tokenUrl = new URL('https://graph.qq.com/oauth2.0/token');
    tokenUrl.searchParams.set('grant_type', bodyParams.get('grant_type') || 'authorization_code');
    tokenUrl.searchParams.set('client_id', bodyParams.get('client_id') || clientId);
    tokenUrl.searchParams.set('client_secret', bodyParams.get('client_secret') || clientSecret);
    tokenUrl.searchParams.set('code', bodyParams.get('code') || '');
    tokenUrl.searchParams.set('redirect_uri', bodyParams.get('redirect_uri') || '');

    const tokenRes = await fetch(tokenUrl);
    const tokenData = parseQqPayload(await tokenRes.text());
    if (!tokenData.access_token) {
      return Response.json(
        {
          error: tokenData.error || 'invalid_grant',
          error_description:
            tokenData.error_description || tokenData.msg || 'QQ 换取 access_token 失败',
        },
        { status: 400 },
      );
    }

    return Response.json({
      access_token: tokenData.access_token,
      token_type: 'bearer',
      refresh_token: tokenData.refresh_token,
      expires_in: Number(tokenData.expires_in) || 7776000,
    });
  };
}

async function fetchQqOpenId(accessToken: string): Promise<string> {
  const meUrl = new URL('https://graph.qq.com/oauth2.0/me');
  meUrl.searchParams.set('access_token', accessToken);
  const meRes = await fetch(meUrl);
  const meData = parseQqPayload(await meRes.text());
  if (!meData.openid) {
    throw new Error(meData.error_description || meData.error || 'QQ 获取 openid 失败');
  }
  return meData.openid;
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
    // ponytail: 关 PKCE/state，避免反代丢 cookie；QQ 也不走标准 PKCE
    checks: [],
    client: { token_endpoint_auth_method: 'client_secret_post' },
    authorization: {
      url: 'https://graph.qq.com/oauth2.0/authorize',
      params: { scope: 'get_user_info', response_type: 'code' },
    },
    token: {
      url: 'https://graph.qq.com/oauth2.0/token',
    },
    userinfo: {
      url: 'https://graph.qq.com/user/get_user_info',
      async request({ tokens, provider }) {
        const accessToken = String(tokens.access_token || '');
        let openid = String((tokens as { openid?: string }).openid || '');
        if (!openid) openid = await fetchQqOpenId(accessToken);
        const url = new URL('https://graph.qq.com/user/get_user_info');
        url.searchParams.set('access_token', accessToken);
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
    [customFetch]: qqCustomFetch(clientId, clientSecret),
  };
}
