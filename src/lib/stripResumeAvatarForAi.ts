/** 发往 AI 前剔除 info1.options.avatar，降低 token 消耗 */
export function stripResumeAvatarForAi<T>(resume: T): T {
  if (!resume || typeof resume !== 'object') return resume;
  const clone = JSON.parse(JSON.stringify(resume)) as Record<string, unknown>;
  const pages = clone.pages;
  if (!Array.isArray(pages)) return clone as T;
  for (const page of pages) {
    if (!page || typeof page !== 'object') continue;
    const modules = (page as { modules?: unknown[] }).modules;
    if (!Array.isArray(modules)) continue;
    for (const mod of modules) {
      if (!mod || typeof mod !== 'object') continue;
      const m = mod as { type?: string; options?: Record<string, unknown> };
      if (m.type !== 'info1' || !m.options || typeof m.options !== 'object') continue;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { avatar, ...rest } = m.options;
      m.options = rest;
    }
  }
  return clone as T;
}
