import defaultResume from '@/json/resume.defaults';
import type { ResumeTemplateItem } from '@/json/resumeTemplates';

export const HOME_TEMPLATE_PLACEHOLDER_COUNT = 30;

/** 仅纸张尺寸，供物理引擎立即开跑；API 返回后替换 */
export function buildHomePlaceholderTemplates(): ResumeTemplateItem[] {
  const gs = defaultResume.globalStyle as Record<string, unknown>;
  return Array.from({ length: HOME_TEMPLATE_PLACEHOLDER_COUNT }, (_, i) => ({
    id: `__home-ph-${i}`,
    title: '',
    config: {
      name: '',
      globalStyle: gs,
      pages: [{ modules: [] }],
    },
  }));
}
