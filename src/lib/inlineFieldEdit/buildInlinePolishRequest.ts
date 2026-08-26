import type { PolishRequest } from '@/lib/ai/polish/types';
import { configStore } from '@/mobx';
import { intentPostsFromResumeConfig } from '@/utils/intentPosts';
import type { ParsedItemTarget } from './parseItemTarget';

function cityLabel(item: { city?: unknown }): string {
  if (Array.isArray(item.city)) return item.city.join(' - ');
  return String(item.city ?? '').trim();
}

export function buildInlinePolishRequest(
  module: Record<string, unknown> | null,
  moduleType: string,
  target: ParsedItemTarget,
  richTextHtml: string,
): PolishRequest | null {
  if (!module) return null;
  const intentPosts = intentPostsFromResumeConfig(configStore.getConfig);
  const options = module.options as Record<string, unknown> | undefined;

  if (moduleType === 'skill') {
    return { type: 'skill', richTextHtml, intentPosts };
  }

  if (moduleType === 'other') {
    return {
      type: 'other',
      richTextHtml,
      intentPosts,
      context: { moduleTitle: String(options?.title ?? '') },
    };
  }

  const idx = target.optionIndex;
  if (idx == null) return null;
  const items = options?.items as Record<string, unknown>[] | undefined;
  const item = items?.[idx];
  if (!item) return null;

  if (moduleType === 'job') {
    const startDate = String(item.startDate ?? '');
    const endDate = String(item.endDate ?? '');
    const timeStr = startDate && endDate ? `${startDate} ~ ${endDate}` : '';
    const postDept = [item.post, item.department]
      .map((s) => String(s ?? '').trim())
      .filter(Boolean)
      .join(' / ');
    return {
      type: 'job',
      richTextHtml,
      intentPosts,
      context: {
        company: String(item.company ?? ''),
        time: timeStr,
        postDepartment: postDept,
        city: cityLabel(item),
      },
    };
  }

  if (moduleType === 'project') {
    return {
      type: 'project',
      richTextHtml,
      intentPosts,
      context: {
        projectName: String(item.name ?? ''),
        role: String(item.role ?? ''),
      },
    };
  }

  if (moduleType === 'education') {
    const startDate = String(item.startDate ?? '');
    const endDate = String(item.endDate ?? '');
    const studyTime = startDate && endDate ? `${startDate} ~ ${endDate}` : '';
    const schoolTypeTags = Array.isArray(item.tags) ? item.tags.join('、') : '';
    return {
      type: 'education',
      richTextHtml,
      intentPosts,
      context: {
        school: String(item.school ?? ''),
        degree: String(item.degree ?? ''),
        major: String(item.major ?? ''),
        city: cityLabel(item),
        schoolTypeTags,
        academy: String(item.academy ?? ''),
        studyTime,
      },
    };
  }

  return null;
}
