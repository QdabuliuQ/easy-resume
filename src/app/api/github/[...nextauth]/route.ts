import { handlers } from '@/auth';
import { GITHUB_CALLBACK_PATH } from '@/lib/authPaths';
import { NextRequest } from 'next/server';

/** GitHub OAuth App 回调是 /api/github/callback；Auth.js 需要 /callback/github */
function normalizeAuthRequest(req: NextRequest): NextRequest {
  const url = req.nextUrl.clone();
  const path = url.pathname.replace(/\/$/, '') || '/';
  if (path !== GITHUB_CALLBACK_PATH) return req;
  url.pathname = `${GITHUB_CALLBACK_PATH}/github`;
  return new NextRequest(url.toString(), {
    method: req.method,
    headers: req.headers,
  });
}

export async function GET(req: NextRequest) {
  return handlers.GET(normalizeAuthRequest(req));
}

export async function POST(req: NextRequest) {
  return handlers.POST(normalizeAuthRequest(req));
}
