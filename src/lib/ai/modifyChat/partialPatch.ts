import type { ResumeConfig } from './resumeSchema';
import { cloneResumeConfig } from './resumeSummary';
import { canAddResumeModuleItem, getResumeModuleItemMaxCount } from '@/utils/moduleTypeLimits';
import { ensureResumeModuleItemsId } from '@/utils/createResumeModule';
import type { ModifyScopeTarget, ScopeOutput } from './resumeSchema';

const LIST_ITEM_MODULE_TYPES = new Set(['job', 'project', 'education', 'certificate']);

type ModuleLike = { type: string; id: string; options?: Record<string, unknown> };

export function isListItemModuleType(type: string): boolean {
  return LIST_ITEM_MODULE_TYPES.has(type);
}

export function isWholeModuleRemoveIntent(
  scope: Pick<ScopeOutput, 'action'>,
  target: ModifyScopeTarget,
  moduleType: string,
  message: string,
): boolean {
  if (scope.action !== 'remove') return false;
  if (target.itemIndex != null) return false;
  if (!isListItemModuleType(moduleType)) return true;
  return /删除.{0,8}模块|去掉.{0,8}模块|移除.{0,8}模块|删掉整个|删除整个|整个.{0,4}删/.test(message.trim());
}

export function appendModuleToResume(resume: unknown, module: ModuleLike): ResumeConfig {
  const next = cloneResumeConfig(resume);
  const page = next.pages?.[0];
  if (!page?.modules) throw new Error('简历结构无效');
  page.modules.push(JSON.parse(JSON.stringify(module)));
  return next;
}

export function initModuleItemsRule(moduleType: string): string {
  if (moduleType === 'skill' || moduleType === 'other') {
    return '4. 用户要求新建模块：按指令填充 options.title 与 description(HTML)；无 items。';
  }
  return `4. 用户要求新建 ${moduleType} 模块：按指令填充 options 与 items，可一次写入用户列出的全部条目；字段名须与 schema 一致（job/project/education 用 startDate+endDate，禁止 time/studyTime）；certificate 每条 name+date(YYYY-MM-DD)；条目 id 可省略。`;
}

export function validateInitModule(original: ModuleLike, modified: ModuleLike): string | null {
  if (original.id !== modified.id) return `module.id 须为 ${original.id}`;
  if (original.type !== modified.type) return `module.type 须为 ${original.type}`;
  if (isListItemModuleType(original.type)) {
    const modItems = modified.options?.items;
    if (!Array.isArray(modItems) || modItems.length === 0) return 'items 至少 1 条';
    const max = getResumeModuleItemMaxCount(original.type);
    if (max != null && modItems.length > max) return `items 最多 ${max} 条`;
    return null;
  }
  if (original.type === 'skill' || original.type === 'other') {
    const desc = modified.options?.description;
    if (typeof desc !== 'string' || !desc.trim()) return 'description 不能为空';
  }
  return null;
}

export function mergeModuleIntoResume(
  resume: unknown,
  pageIndex: number,
  moduleIndex: number,
  module: ModuleLike,
): ResumeConfig {
  const next = cloneResumeConfig(resume);
  const orig = (resume as ResumeConfig)?.pages?.[pageIndex]?.modules?.[moduleIndex];
  if (!orig) throw new Error('模块位置无效');
  if (orig.id !== module.id || orig.type !== module.type) {
    throw new Error(`模块 id/type 须与原文一致（${orig.id}/${orig.type}）`);
  }
  next.pages[pageIndex]!.modules[moduleIndex] = JSON.parse(JSON.stringify(module));
  return next;
}

export function removeModuleFromResume(
  resume: unknown,
  pageIndex: number,
  moduleIndex: number,
): ResumeConfig {
  const next = cloneResumeConfig(resume);
  const page = next.pages[pageIndex];
  if (!page?.modules?.length) throw new Error('模块位置无效');
  if (moduleIndex < 0 || moduleIndex >= page.modules.length) throw new Error('模块位置无效');
  if (page.modules[moduleIndex]?.type === 'info1') throw new Error('个人信息模块不可删除');
  page.modules.splice(moduleIndex, 1);
  if (page.modules.length === 0) throw new Error('每页至少保留一个模块');
  return next;
}

export function partialItemsRule(scope: ScopeOutput): string {
  if (scope.action === 'add') {
    return '4. 用户要求新增条目：在 items 数组末尾追加恰好 1 条，原有条目及其 id 须原样保留；certificate 新条含 name、date(YYYY-MM-DD)；job 含 company/post/department/city/startDate/endDate；project 含 name/role/startDate/endDate；education 含 school/degree/major 等；id 可省略。';
  }
  if (scope.action === 'remove') {
    return '4. 用户要求删除条目：从 items 移除指定条目（可删一条或多条，可删至 0 条）；保留条目的 id 须与原 JSON 一致。';
  }
  return '4. items 数组长度须与输入一致，禁止增删条目（除非用户明确要求删除/新增）。';
}

export function normalizePartialModule(_original: ModuleLike, modified: ModuleLike): ModuleLike {
  return ensureResumeModuleItemsId(JSON.parse(JSON.stringify(modified)) as ModuleLike);
}

export function validatePartialModule(
  original: ModuleLike,
  modified: ModuleLike,
  scope?: Pick<ScopeOutput, 'action'>,
): string | null {
  if (original.id !== modified.id) return `module.id 须为 ${original.id}`;
  if (original.type !== modified.type) return `module.type 须为 ${original.type}`;
  const origItems = original.options?.items;
  const modItems = modified.options?.items;
  if (!Array.isArray(origItems) || !Array.isArray(modItems)) return null;
  const action = scope?.action;
  if (action === 'add') {
    if (modItems.length !== origItems.length + 1) {
      return `新增后 items 应为 ${origItems.length + 1} 条`;
    }
    if (!canAddResumeModuleItem(original.type, origItems.length)) {
      const max = getResumeModuleItemMaxCount(original.type);
      return max != null ? `${original.type} 模块 items 最多 ${max} 条` : 'items 已达上限';
    }
    const origIds = origItems.map((item) => (item as { id?: string }).id).filter(Boolean);
    for (const id of origIds) {
      if (!modItems.some((item) => (item as { id?: string }).id === id)) {
        return '新增条目时须保留原有 items 及其 id';
      }
    }
    return null;
  }
  if (action === 'remove') {
    if (origItems.length === 0) return 'items 为空，无法删除';
    if (modItems.length >= origItems.length) {
      return '删除后 items 须少于原有条数';
    }
    const origIds = new Set(
      origItems.map((item) => (item as { id?: string }).id).filter(Boolean),
    );
    for (const item of modItems) {
      const id = (item as { id?: string }).id;
      if (id && !origIds.has(id)) return '保留的 items id 须来自原 JSON';
    }
    return null;
  }
  if (origItems.length !== modItems.length) {
    return `items 须为 ${origItems.length} 条`;
  }
  return null;
}
