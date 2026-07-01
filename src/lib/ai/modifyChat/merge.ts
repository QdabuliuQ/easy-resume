import { sanitizeResumeHtmlFields } from './sanitizeResume';
import type { ResumeConfig } from './resumeSchema';

type ModuleLike = { type?: string; id?: string; options?: Record<string, unknown> };
type PageLike = { modules?: ModuleLike[] };

/** 校验 AI 返回的 resume 与原文结构一致（页数、模块 id/type；允许删除模块） */
export function validateResumeStructureMatch(original: unknown, modified: ResumeConfig): string | null {
  if (!original || typeof original !== 'object' || Array.isArray(original)) {
    return '输入简历无效';
  }
  const origPages = (original as { pages?: PageLike[] }).pages;
  if (!Array.isArray(origPages) || origPages.length === 0) return '输入简历 pages 无效';
  if (modified.pages.length !== origPages.length) {
    return `resume.pages 须为 ${origPages.length} 页`;
  }
  for (let pi = 0; pi < origPages.length; pi++) {
    const origMods = origPages[pi]?.modules;
    const modMods = modified.pages[pi]?.modules;
    if (!Array.isArray(origMods) || !Array.isArray(modMods)) {
      return `pages[${pi}].modules 无效`;
    }
    if (modMods.length > origMods.length) {
      return `pages[${pi}].modules 不能超过原有 ${origMods.length} 个`;
    }
    if (modMods.length === 0) {
      return `pages[${pi}].modules 至少保留 1 个模块`;
    }
    if (modMods.length < origMods.length) {
      const origById = new Map(origMods.map((m) => [m?.id, m]));
      for (let mi = 0; mi < modMods.length; mi++) {
        const m = modMods[mi];
        const o = m?.id ? origById.get(m.id) : undefined;
        if (!o?.id || !m?.id) return `pages[${pi}].modules[${mi}].id 无效`;
        if (o.type !== m.type) return `pages[${pi}].modules[${mi}].type 须为 ${o.type}`;
      }
      continue;
    }
    for (let mi = 0; mi < origMods.length; mi++) {
      const o = origMods[mi];
      const m = modMods[mi];
      if (!o?.id || !m?.id) return `pages[${pi}].modules[${mi}].id 无效`;
      if (o.id !== m.id) return `pages[${pi}].modules[${mi}].id 须为 ${o.id}`;
      if (o.type !== m.type) return `pages[${pi}].modules[${mi}].type 须为 ${o.type}`;
    }
  }
  return null;
}

/** 以 AI resume 为底，补全原文顶层字段并保留 avatar */
export function finalizeModifiedResume(original: unknown, modified: ResumeConfig): ResumeConfig {
  const next = JSON.parse(JSON.stringify(modified)) as ResumeConfig;
  if (!original || typeof original !== 'object' || Array.isArray(original)) {
    return sanitizeResumeHtmlFields(next);
  }
  const orig = original as Record<string, unknown>;
  if (typeof orig.name === 'string' && orig.name && !next.name?.trim()) {
    next.name = orig.name;
  }
  if (orig.globalStyle && typeof orig.globalStyle === 'object' && !Array.isArray(orig.globalStyle)) {
    next.globalStyle = {
      ...(orig.globalStyle as Record<string, unknown>),
      ...next.globalStyle,
    } as ResumeConfig['globalStyle'];
  }
  if (next.exportPages == null && orig.exportPages != null) {
    next.exportPages = orig.exportPages as number[] | null;
  }
  return sanitizeResumeHtmlFields(mergeResumePreserveAssets(original, next));
}

export function mergeResumePreserveAssets(original: unknown, modified: ResumeConfig): ResumeConfig {
  const next = JSON.parse(JSON.stringify(modified)) as ResumeConfig;
  if (!original || typeof original !== 'object' || Array.isArray(original)) return next;
  const orig = original as { pages?: PageLike[] };
  const origPages = orig.pages;
  if (!Array.isArray(origPages)) return next;
  for (let pi = 0; pi < next.pages.length; pi++) {
    const origMods = origPages[pi]?.modules;
    if (!Array.isArray(origMods)) continue;
    const mods = next.pages[pi].modules;
    for (const mod of mods) {
      if (mod.type !== 'info1') continue;
      const origMod = origMods.find((m) => m.id === mod.id);
      const avatar = origMod?.options?.avatar;
      if (avatar && !mod.options?.avatar) {
        mod.options = { ...mod.options, avatar };
      }
    }
  }
  return next;
}
