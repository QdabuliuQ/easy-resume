/** AI 评分/分析前剔除 info1 模块（含头像等个人信息） */
export function stripResumeForAiAnalyze<T>(resume: T): T {
  if (!resume || typeof resume !== 'object') return resume;
  const clone = JSON.parse(JSON.stringify(resume)) as Record<string, unknown>;
  const pages = clone.pages;
  if (!Array.isArray(pages)) return clone as T;
  for (const page of pages) {
    if (!page || typeof page !== 'object') continue;
    const modules = (page as { modules?: unknown[] }).modules;
    if (!Array.isArray(modules)) continue;
    (page as { modules: unknown[] }).modules = modules.filter(
      (mod) => !mod || typeof mod !== 'object' || (mod as { type?: string }).type !== 'info1',
    );
  }
  return clone as T;
}
