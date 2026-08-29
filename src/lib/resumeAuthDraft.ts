/** OAuth 整页跳转前暂存编辑中的简历，登录回来后恢复 */

export const RESUME_AUTH_DRAFT_KEY = 'easy-resume:auth-draft';
/** ponytail: 1h TTL；过期丢弃，避免隔天误恢复旧草稿 */
export const RESUME_AUTH_DRAFT_TTL_MS = 60 * 60 * 1000;

type DraftPayload = {
  v: 1;
  savedAt: number;
  config: unknown;
};

export function isEditPath(pathname: string): boolean {
  return /\/edit(?:\/|$)/.test(pathname);
}

function isResumeDraftConfig(config: unknown): config is Record<string, unknown> {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return false;
  const pages = (config as { pages?: unknown }).pages;
  return Array.isArray(pages) && pages.length > 0;
}

export function persistResumeAuthDraft(config: unknown, now = Date.now()): boolean {
  if (!isResumeDraftConfig(config)) return false;
  try {
    const payload: DraftPayload = {
      v: 1,
      savedAt: now,
      config: JSON.parse(JSON.stringify(config)),
    };
    sessionStorage.setItem(RESUME_AUTH_DRAFT_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/** 读取并清除草稿；无效 / 过期返回 null */
export function consumeResumeAuthDraft(now = Date.now()): Record<string, unknown> | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(RESUME_AUTH_DRAFT_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    sessionStorage.removeItem(RESUME_AUTH_DRAFT_KEY);
  } catch {
    /* ignore */
  }
  try {
    const parsed = JSON.parse(raw) as DraftPayload;
    if (parsed?.v !== 1 || typeof parsed.savedAt !== 'number') return null;
    if (now - parsed.savedAt > RESUME_AUTH_DRAFT_TTL_MS) return null;
    if (!isResumeDraftConfig(parsed.config)) return null;
    return JSON.parse(JSON.stringify(parsed.config)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function clearResumeAuthDraft(): void {
  try {
    sessionStorage.removeItem(RESUME_AUTH_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
