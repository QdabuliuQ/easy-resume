import { resumePageHasSideCol } from '@/lib/resumePageLayout';

export function findFirstInfo1Module(
  resume: { pages?: Array<{ modules?: unknown[] }> } | null | undefined,
): Record<string, unknown> | null {
  if (!resume?.pages?.length) return null;
  for (const page of resume.pages) {
    for (const mod of page.modules ?? []) {
      const m = mod as { type?: string };
      if (m?.type === 'info1') return mod as Record<string, unknown>;
    }
  }
  return null;
}

export function shouldPlaceInfo1InSideCol(layout: unknown): boolean {
  return resumePageHasSideCol(layout);
}
