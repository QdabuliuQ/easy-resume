import { auth } from '@/auth';
import { err } from '@/lib/ai/score/routeShared';
import type { NextResponse } from 'next/server';

export type InterviewAuth =
  | { ownerKey: string; uid?: string; isDev: boolean }
  | { error: NextResponse };

export async function requireInterviewAuth(): Promise<InterviewAuth> {
  const session = await auth();
  const uid = session?.user?.uid;
  if (!uid) {
    return { error: err('请先登录', 401) };
  }
  return { ownerKey: uid, uid, isDev: false };
}

export function assertSessionOwner(
  sessionOwner: string,
  ownerKey: string,
): NextResponse | null {
  if (sessionOwner !== ownerKey) return err('无权访问该面试会话', 403);
  return null;
}
