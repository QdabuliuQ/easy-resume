import { Redis } from '@upstash/redis';
import {
  INTERVIEW_SESSION_TTL_MS,
  type InterviewSession,
} from '@/lib/ai/interview/types';
import { stripResumeForAiAnalyze } from '@/lib/stripResumeForAiAnalyze';

const mem = new Map<string, InterviewSession>();
const activeByOwner = new Map<string, string>();
/** sessionId -> lock expiry ms；无 Redis 时防同进程双开 report */
const reportLocks = new Map<string, number>();

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

/** 生产必须 Upstash；本地可用内存。返回错误文案，null 表示可用。 */
export function interviewStoreError(): string | null {
  if (process.env.NODE_ENV !== 'production') return null;
  if (getRedis()) return null;
  return '服务未配置会话存储（Upstash Redis），无法使用 AI 面试';
}

function redisKey(id: string) {
  return `interview:session:${id}`;
}

function ownerKey(owner: string) {
  return `interview:active:${owner}`;
}

function alive(s: InterviewSession | null | undefined): InterviewSession | null {
  if (!s) return null;
  if (Date.now() > s.expiresAt) return null;
  return s;
}

export async function saveInterviewSession(session: InterviewSession): Promise<void> {
  const storeErr = interviewStoreError();
  if (storeErr) throw new Error(storeErr);
  session.resume = stripResumeForAiAnalyze(session.resume);
  const redis = getRedis();
  if (redis) {
    const ttlSec = Math.max(60, Math.ceil((session.expiresAt - Date.now()) / 1000));
    await redis.set(redisKey(session.id), JSON.stringify(session), { ex: ttlSec });
    await redis.set(ownerKey(session.ownerKey), session.id, { ex: ttlSec });
  }
  mem.set(session.id, session);
  activeByOwner.set(session.ownerKey, session.id);
}

function reportLockKey(id: string) {
  return `interview:report-lock:${id}`;
}

/** 同一 session 同时只允许一次 report LLM；ttl 覆盖 maxDuration */
export async function tryAcquireReportLock(sessionId: string, ttlMs = 90_000): Promise<boolean> {
  const now = Date.now();
  const localExp = reportLocks.get(sessionId);
  if (localExp && localExp > now) return false;
  reportLocks.set(sessionId, now + ttlMs);
  const redis = getRedis();
  if (!redis) return true;
  const ok = await redis.set(reportLockKey(sessionId), '1', { nx: true, px: ttlMs });
  if (!ok) {
    reportLocks.delete(sessionId);
    return false;
  }
  return true;
}

export async function releaseReportLock(sessionId: string): Promise<void> {
  reportLocks.delete(sessionId);
  const redis = getRedis();
  if (!redis) return;
  await redis.del(reportLockKey(sessionId));
}

/** 有 Redis 时以 Redis 为准；本地无 Redis 走内存 */
export async function getInterviewSession(id: string): Promise<InterviewSession | null> {
  const redis = getRedis();
  if (redis) {
    const raw = await redis.get<string>(redisKey(id));
    if (!raw) {
      mem.delete(id);
      return null;
    }
    const parsed = typeof raw === 'string' ? (JSON.parse(raw) as InterviewSession) : (raw as InterviewSession);
    const s = alive(parsed);
    if (!s) {
      mem.delete(id);
      return null;
    }
    mem.set(s.id, s);
    return s;
  }
  if (interviewStoreError()) return null;
  return alive(mem.get(id)) ?? null;
}

export async function deleteInterviewSession(id: string, owner?: string): Promise<void> {
  mem.delete(id);
  if (owner && activeByOwner.get(owner) === id) activeByOwner.delete(owner);
  const redis = getRedis();
  if (!redis) return;
  await redis.del(redisKey(id));
  if (owner) {
    const cur = await redis.get<string>(ownerKey(owner));
    if (cur === id) await redis.del(ownerKey(owner));
  }
}

export async function replaceOwnerActiveSession(
  ownerKeyValue: string,
  next: InterviewSession,
): Promise<void> {
  const prevId = activeByOwner.get(ownerKeyValue);
  if (prevId && prevId !== next.id) await deleteInterviewSession(prevId, ownerKeyValue);
  const redis = getRedis();
  if (redis) {
    const prev = await redis.get<string>(ownerKey(ownerKeyValue));
    if (prev && prev !== next.id) await deleteInterviewSession(prev, ownerKeyValue);
  }
  await saveInterviewSession(next);
}

export function freshExpiry(now = Date.now()): number {
  return now + INTERVIEW_SESSION_TTL_MS;
}
