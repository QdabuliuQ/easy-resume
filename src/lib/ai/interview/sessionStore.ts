import { Redis } from '@upstash/redis';
import {
  INTERVIEW_SESSION_TTL_MS,
  type InterviewSession,
} from '@/lib/ai/interview/types';

const mem = new Map<string, InterviewSession>();
const activeByOwner = new Map<string, string>();

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
  mem.set(session.id, session);
  activeByOwner.set(session.ownerKey, session.id);
  const redis = getRedis();
  if (!redis) return;
  const ttlSec = Math.max(60, Math.ceil((session.expiresAt - Date.now()) / 1000));
  await redis.set(redisKey(session.id), JSON.stringify(session), { ex: ttlSec });
  await redis.set(ownerKey(session.ownerKey), session.id, { ex: ttlSec });
}

export async function getInterviewSession(id: string): Promise<InterviewSession | null> {
  const local = alive(mem.get(id));
  if (local) return local;
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get<string>(redisKey(id));
  if (!raw) return null;
  const parsed = typeof raw === 'string' ? (JSON.parse(raw) as InterviewSession) : (raw as InterviewSession);
  const s = alive(parsed);
  if (!s) return null;
  mem.set(s.id, s);
  return s;
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
