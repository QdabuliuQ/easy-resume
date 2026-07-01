import type { ResumeTemplateItem } from '@/json/resumeTemplates';

let cache: ResumeTemplateItem[] | null = null;

export async function loadResumeTemplates(): Promise<ResumeTemplateItem[]> {
  if (!cache) {
    const mod = await import('@/json/resumeTemplates');
    cache = mod.resumeTemplates;
  }
  return cache;
}

export async function loadResumeTemplateByIndex(index: number): Promise<ResumeTemplateItem | null> {
  const list = await loadResumeTemplates();
  if (!Number.isFinite(index) || index < 1 || index > list.length) return null;
  return list[index - 1] ?? null;
}
