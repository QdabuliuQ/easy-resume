import resumeAvatars from '@/json/resumeAvatars.json';

const PREFIX = 'resumeAvatar:';

type AvatarMap = Record<string, string>;

const map = resumeAvatars as AvatarMap;

function resolveResumeAvatarString(v: unknown): unknown {
  if (typeof v !== 'string' || !v.startsWith(PREFIX)) return v;
  const key = v.slice(PREFIX.length);
  const resolved = map[key];
  return resolved != null ? resolved : v;
}

/** 深拷贝并解析 info 等处的 resumeAvatar: 引用为完整 data URL */
export function resolveResumeAvatarRefsDeep<T>(obj: T): T {
  const walk = (x: unknown): unknown => {
    if (x == null) return x;
    if (typeof x === 'string') return resolveResumeAvatarString(x);
    if (Array.isArray(x)) return x.map(walk);
    if (typeof x === 'object') {
      const o = x as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(o)) out[k] = walk(o[k]);
      return out;
    }
    return x;
  };
  return walk(JSON.parse(JSON.stringify(obj))) as T;
}
