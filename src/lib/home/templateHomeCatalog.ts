import type { ResumeTemplateItem } from '@/json/resumeTemplates';
import { loadResumeTemplates } from '@/lib/loadResumeTemplates';

let catalogPromise: Promise<ResumeTemplateItem[]> | null = null;

function loadHomeCatalog() {
  return loadResumeTemplates({ lite: true });
}

export function prefetchHomeTemplateCatalog() {
  if (typeof window === 'undefined') return;
  if (!catalogPromise) catalogPromise = loadHomeCatalog();
}

export function getHomeTemplateCatalog() {
  if (!catalogPromise) catalogPromise = loadHomeCatalog();
  return catalogPromise;
}
