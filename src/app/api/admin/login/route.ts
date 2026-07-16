import { NextRequest, NextResponse } from 'next/server';
import {
  clearAdminCookie,
  createAdminToken,
  getAdminCredentials,
  readAdminSession,
  safeEqualStr,
  setAdminCookie,
} from '@/lib/adminAuth';
import {
  checkAdminLoginAllowed,
  clearAdminLoginFail,
  recordAdminLoginFail,
} from '@/lib/adminLoginRateLimit';
import { getClientIp } from '@/lib/ai/score/routeShared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, username: session.username });
}

export async function POST(req: NextRequest) {
  const { username: expectUser, password: expectPass } = getAdminCredentials();
  if (!expectUser || !expectPass) {
    return NextResponse.json({ error: '未配置 ADMIN_USERNAME / ADMIN_PASSWORD' }, { status: 503 });
  }
  if (!process.env.ADMIN_SECRET && !process.env.AUTH_SECRET) {
    return NextResponse.json({ error: '未配置 ADMIN_SECRET' }, { status: 503 });
  }

  const ip = getClientIp(req);
  const gate = checkAdminLoginAllowed(ip);
  if (!gate.ok) {
    return NextResponse.json(
      { error: `登录失败次数过多，请 ${gate.retryAfterSec} 秒后再试` },
      { status: 429, headers: { 'Retry-After': String(gate.retryAfterSec) } },
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体必须是 JSON' }, { status: 400 });
  }

  const username = String(body.username || '');
  const password = String(body.password || '');
  if (!safeEqualStr(username, expectUser) || !safeEqualStr(password, expectPass)) {
    recordAdminLoginFail(ip);
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  }

  clearAdminLoginFail(ip);
  const res = NextResponse.json({ ok: true, username });
  setAdminCookie(res, createAdminToken(username));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearAdminCookie(res);
  return res;
}
