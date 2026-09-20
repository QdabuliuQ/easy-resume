import { auth } from '@/auth';

/** 所有 AI 能力共用的登录校验，避免仅依赖前端隐藏入口。 */
export async function requireAiAuth(): Promise<Response | null> {
  const session = await auth();
  if (!session?.user?.uid) {
    return Response.json({ error: '请先登录后再使用 AI 功能' }, { status: 401 });
  }
  return null;
}
