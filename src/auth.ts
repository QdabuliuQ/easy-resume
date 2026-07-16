import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { customFetch } from 'next-auth';
import { AUTH_BASE_PATH, GITHUB_CALLBACK_PATH } from '@/lib/authPaths';
import { cfApiBase, cfApiHeaders, cfApiSecret } from '@/lib/cfApi';

export { AUTH_BASE_PATH, GITHUB_CALLBACK_PATH };

/** OAuth 回调 origin：跟当前请求走，绝不用 NEXT_PUBLIC_SITE_URL（那是站点 SEO 地址） */
function resolveAuthOrigin(req?: Request): string {
  if (req) {
    try {
      const url = new URL(req.url);
      const xfHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
      const xfProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
      if (xfHost) {
        const proto = xfProto || url.protocol.replace(':', '') || 'https';
        return `${proto}://${xfHost}`;
      }
      const host = req.headers.get('host');
      if (host) {
        const proto = xfProto || url.protocol.replace(':', '') || 'http';
        return `${proto}://${host}`;
      }
      return url.origin;
    } catch {
      /* fall through */
    }
  }
  const raw = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      /* fall through */
    }
  }
  return 'http://localhost:3000';
}

function githubCallbackUrl(origin: string): string {
  return `${origin.replace(/\/$/, '')}${GITHUB_CALLBACK_PATH}`;
}

function githubProvider(redirectUri: string) {
  return GitHub({
    authorization: {
      params: {
        scope: 'read:user user:email',
        redirect_uri: redirectUri,
      },
    },
    [customFetch]: async (...args: Parameters<typeof fetch>) => {
      const [input, init] = args;
      if (init?.body instanceof URLSearchParams && init.body.has('redirect_uri')) {
        const body = new URLSearchParams(init.body);
        body.set('redirect_uri', redirectUri);
        return fetch(input, { ...init, body });
      }
      return fetch(input, init);
    },
  });
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

function authConfig(req?: Request): NextAuthConfig {
  const redirectUri = githubCallbackUrl(resolveAuthOrigin(req));
  return {
    providers: [githubProvider(redirectUri)],
    basePath: AUTH_BASE_PATH,
    trustHost: true,
    session: { strategy: 'jwt' },
    pages: {
      signIn: '/',
      error: '/',
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
}

export const { handlers, auth, signIn, signOut } = NextAuth((req) => authConfig(req));
