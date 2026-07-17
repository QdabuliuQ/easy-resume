import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { customFetch } from 'next-auth';
import { Agent, ProxyAgent, fetch as undiciFetch } from 'undici';
import { AUTH_BASE_PATH, GITHUB_CALLBACK_PATH } from '@/lib/authPaths';
import { cfApiBase, cfApiHeaders, cfApiSecret } from '@/lib/cfApi';

export { AUTH_BASE_PATH, GITHUB_CALLBACK_PATH };

/** 生产反代 Host 常是 localhost:3010；给 Auth.js 写死公网地址 */
if (process.env.NODE_ENV === 'production') {
  const site = process.env.AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (site) process.env.AUTH_URL = site;
}

/**
 * GitHub OAuth 专用 fetch。
 * - token 走 CF Worker 时自动带 X-CF-Key
 * - 直连 github 时强制 IPv4；可选 AUTH_GITHUB_PROXY
 */
function githubProxyFetch(): typeof fetch {
  const proxy =
    process.env.AUTH_GITHUB_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    '';
  const connect = { family: 4 as const, timeout: 30_000 };
  const dispatcher = proxy
    ? new ProxyAgent({ uri: proxy, connect })
    : new Agent({ connect, connectTimeout: 30_000 });
  const apiBase = cfApiBase();
  const apiSecret = cfApiSecret();
  return ((input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    if (apiBase && apiSecret && url.startsWith(apiBase)) {
      headers.set('X-CF-Key', apiSecret);
    }
    return undiciFetch(url as Parameters<typeof undiciFetch>[0], {
      ...(init as object),
      headers,
      dispatcher,
      headersTimeout: 60_000,
      bodyTimeout: 60_000,
    } as Parameters<typeof undiciFetch>[1]);
  }) as unknown as typeof fetch;
}

function githubTokenEndpoint(): { url: string } | undefined {
  const base = cfApiBase();
  if (!base || !cfApiSecret()) return undefined;
  return { url: `${base}/api/oauth/github/token` };
}

/** 登录成功后同步用户到 cf-api D1 users 表，返回 uid */
async function syncUserToCfApi(profile: {
  id?: string | number | null;
  login?: string;
  avatar_url?: string;
  image?: string | null;
  email?: string | null;
}): Promise<string | null> {
  const base = cfApiBase();
  if (!base || !cfApiSecret() || profile.id == null) return null;
  try {
    const res = await fetch(`${base}/api/user/sync`, {
      method: 'POST',
      headers: cfApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        github_id: String(profile.id),
        username: profile.login || '',
        avatar: profile.avatar_url || profile.image || '',
        email: profile.email || '',
      }),
    });
    if (!res.ok) {
      console.error('[auth] user sync failed', res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { id?: string };
    return data.id || null;
  } catch (e) {
    console.error('[auth] user sync error', e);
    return null;
  }
}

const githubToken = githubTokenEndpoint();

const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      // ponytail: 关 PKCE/state cookie 校验，避免反代下 cookie 丢失导致 Configuration
      checks: [],
      // 凭证进 body；避免 Worker 漏转 Authorization 时 GitHub 回 404 Not Found
      client: { token_endpoint_auth_method: 'client_secret_post' },
      authorization: { params: { scope: 'read:user user:email' } },
      // 国内机房对 github.com/login/oauth 返回 500；换 token 经 CF Worker
      ...(githubToken ? { token: githubToken } : {}),
      [customFetch]: githubProxyFetch(),
    }),
  ],
  basePath: AUTH_BASE_PATH,
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/zh',
    error: '/zh',
  },
  logger: {
    error(error) {
      console.error('[auth][error]', error.name, error.message, error.cause ?? '');
    },
  },
  callbacks: {
    async jwt({ token, profile }) {
      const gh = profile as
        | {
            id?: string | number | null;
            login?: string;
            avatar_url?: string;
            image?: string | null;
            email?: string | null;
          }
        | undefined;
      if (gh && typeof gh.login === 'string') {
        token.login = gh.login;
      }
      if (gh?.id != null) {
        const uid = await syncUserToCfApi(gh);
        if (uid) token.uid = uid;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) || (token.sub as string) || '';
        session.user.uid = (token.uid as string) || undefined;
        if (typeof token.login === 'string') {
          session.user.login = token.login;
        }
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
