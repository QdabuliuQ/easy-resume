import { moduleType } from '@/modules/utils/constant';
import type { ResumeModuleType } from '@/utils/createResumeModule';

/** 各模块类型全简历合计上限（跨所有分页） */
export const RESUME_MODULE_MAX_COUNT: Record<ResumeModuleType, number> = {
  info1: 1,
  certificate: 5,
  skill: 5,
  job: 5,
  project: 5,
  education: 5,
  other: 5,
};

/** 单个模块内 options.items 条数上限（仅 certificate / job / project / education） */
export type ResumeModuleItemType = Extract<
  ResumeModuleType,
  'certificate' | 'job' | 'project' | 'education'
>;

export const RESUME_MODULE_ITEM_MAX_COUNT: Record<
  ResumeModuleItemType,
  number
> = {
  certificate: 12,
  job: 10,
  project: 10,
  education: 8,
};

export function getResumeModuleItemMaxCount(
  moduleType: string | undefined
): number | undefined {
  if (
    moduleType === 'certificate' ||
    moduleType === 'job' ||
    moduleType === 'project' ||
    moduleType === 'education'
  ) {
    return RESUME_MODULE_ITEM_MAX_COUNT[moduleType];
  }
  return undefined;
}

export function canAddResumeModuleItem(
  moduleType: string | undefined,
  currentItemsLength: number
): boolean {
  const max = getResumeModuleItemMaxCount(moduleType);
  if (max === undefined) return true;
  return currentItemsLength < max;
}

export function resumeModuleItemLimitMessage(t: ResumeModuleItemType): string {
  const label =
    (moduleType as Record<string, { name: string }>)[t]?.name ?? t;
  return `${label}模块内最多 ${RESUME_MODULE_ITEM_MAX_COUNT[t]} 条`;
}

export type ResumeModuleCountConfig = {
  pages?: Array<{ modules?: Array<{ type: string }> }>;
} | null | undefined;

export function countResumeModulesByType(
  config: ResumeModuleCountConfig,
  type: ResumeModuleType
): number {
  if (!config?.pages?.length) return 0;
  let n = 0;
  for (const p of config.pages) {
    for (const m of p.modules ?? []) {
      if (m.type === type) n++;
    }
  }
  return n;
}

export function isResumeModuleTypeAtLimit(
  config: ResumeModuleCountConfig,
  type: ResumeModuleType
): boolean {
  return countResumeModulesByType(config, type) >= RESUME_MODULE_MAX_COUNT[type];
}

/** AI/导入后校验：info1 全简历最多 1 个；原文有 info1 时不可删光 */
export function validateInfo1ModuleChange(original: unknown, modified: unknown): string | null {
  const orig = original as ResumeModuleCountConfig;
  const mod = modified as ResumeModuleCountConfig;
  const origCount = countResumeModulesByType(orig, 'info1');
  const modCount = countResumeModulesByType(mod, 'info1');
  if (modCount > 1) return '个人信息模块只能有 1 个';
  if (origCount >= 1 && modCount === 0) return '个人信息模块不可删除';
  return null;
}
