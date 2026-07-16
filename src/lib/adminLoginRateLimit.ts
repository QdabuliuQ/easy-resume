import { createHash } from 'crypto';

/** 15 分钟窗口内失败 ≥5 次则锁定 15 分钟（进程内；多实例各自计数） */
const FAIL_MAX = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

type Entry = { fails: number; windowStart: number; lockedUntil: number };

const g = globalThis as typeof globalThis & {
  __easyResumeAdminLoginRl?: Map<string, Entry>;
};

function store() {
  if (!g.__easyResumeAdminLoginRl) g.__easyResumeAdminLoginRl = new Map();
  return g.__easyResumeAdminLoginRl;
}

function keyOf(ip: string) {
  return createHash('sha256').update(ip || 'unknown').digest('hex').slice(0, 16);
}

function prune(now: number) {
  const map = store();
  map.forEach((e, k) => {
    if (e.lockedUntil < now && now - e.windowStart > WINDOW_MS) map.delete(k);
  });
}

export function checkAdminLoginAllowed(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const e = store().get(keyOf(ip));
  if (!e) return { ok: true };
  if (e.lockedUntil > now) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((e.lockedUntil - now) / 1000)) };
  }
  return { ok: true };
}

export function recordAdminLoginFail(ip: string) {
  const now = Date.now();
  const map = store();
  const k = keyOf(ip);
  let e = map.get(k);
  if (!e || now - e.windowStart > WINDOW_MS) {
    e = { fails: 0, windowStart: now, lockedUntil: 0 };
  }
  e.fails += 1;
  if (e.fails >= FAIL_MAX) {
    e.lockedUntil = now + LOCK_MS;
    e.fails = 0;
    e.windowStart = now;
  }
  map.set(k, e);
}

export function clearAdminLoginFail(ip: string) {
  store().delete(keyOf(ip));
}

/** @internal tests */
export function __resetAdminLoginRateLimitForTests() {
  store().clear();
}
