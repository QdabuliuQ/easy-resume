import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';
import { isEmptyValue, semanticJsonDiff, type SemanticDiff, type SemanticDiffType } from '@/lib/semanticJsonDiff';

export type PathSegment = string | number;

export type ResumeDiffKind = 'add' | 'remove' | 'update';

export type ResumeDiff = {
  id: string;
  label: string;
  pathKeys: PathSegment[];
  kind: ResumeDiffKind;
  oldValue: unknown;
  newValue: unknown;
  oldDisplay: string;
  newDisplay: string;
};

const MAX_DISPLAY_LEN = 280;

const MODULE_LABELS: Record<string, string> = {
  info1: '基础信息',
  job: '工作经历',
  project: '项目经历',
  education: '教育经历',
  skill: '技能',
  certificate: '证书',
  other: '其他',
};

const FIELD_LABELS: Record<string, string> = {
  name: '简历标题',
  title: '模块标题',
  description: '描述',
  company: '公司',
  post: '职位',
  postDepartment: '部门',
  department: '部门',
  city: '城市',
  projectName: '项目名称',
  role: '角色',
  school: '学校',
  degree: '学历',
  major: '专业',
  skillName: '技能',
  level: '熟练度',
  phone: '电话',
  email: '邮箱',
  position: '布局',
  status: '状态',
  wechat: '微信',
  birthday: '生日',
  gender: '性别',
  intentCity: '意向城市',
  intentPosts: '意向岗位',
  expectedSalary: '期望薪资',
  fontSize: '字号',
  lineHeight: '行高',
  moduleMargin: '模块间距',
  color: '主题色',
  backgroundColor: '背景色',
  pageSize: '纸张',
  layout: '布局',
  padding: '内边距',
  resumeFont: '字体',
  date: '日期',
  startDate: '开始日期',
  endDate: '结束日期',
};

export function inferResumeDiffKind(oldValue: unknown, newValue: unknown): ResumeDiffKind {
  if (isEmptyValue(oldValue) && !isEmptyValue(newValue)) return 'add';
  if (!isEmptyValue(oldValue) && isEmptyValue(newValue)) return 'remove';
  return 'update';
}

function semanticTypeToKind(type: SemanticDiffType, oldValue: unknown, newValue: unknown): ResumeDiffKind {
  if (type === 'MODULE_ADDED' || type === 'ITEM_ADDED') return 'add';
  if (type === 'MODULE_DELETED' || type === 'ITEM_DELETED') return 'remove';
  return inferResumeDiffKind(oldValue, newValue);
}

function formatDisplayValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') {
    const text = /<[^>]+>/.test(value) ? plainTextFromRichHtml(value) : value;
    const trimmed = text.replace(/\s+/g, ' ').trim();
    if (!trimmed) return '—';
    return trimmed.length > MAX_DISPLAY_LEN ? `${trimmed.slice(0, MAX_DISPLAY_LEN)}…` : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    const s = value.map((v) => formatDisplayValue(v)).join(' / ');
    return s || '—';
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.company === 'string') return formatDisplayValue(obj.company);
    if (typeof obj.name === 'string' && !obj.options) return formatDisplayValue(obj.name);
    if (typeof obj.school === 'string') return formatDisplayValue(obj.school);
    const title = obj.options && typeof (obj.options as Record<string, unknown>).title === 'string'
      ? (obj.options as Record<string, unknown>).title as string
      : null;
    if (title) return title;
  }
  try {
    const raw = JSON.stringify(value);
    return raw.length > MAX_DISPLAY_LEN ? `${raw.slice(0, MAX_DISPLAY_LEN)}…` : raw;
  } catch {
    return String(value);
  }
}

function pathKey(path: PathSegment[]): string {
  return path.map((p) => String(p)).join('.');
}

function getByPath(root: unknown, path: PathSegment[]): unknown {
  let cur: unknown = root;
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    if (Array.isArray(cur)) {
      if (typeof key !== 'number') return undefined;
      cur = cur[key];
      continue;
    }
    cur = (cur as Record<string, unknown>)[key as string];
  }
  return cur;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function resolveSemanticPath(path: string, root: unknown): PathSegment[] {
  if (!path || path === 'root') return [];
  const out: PathSegment[] = [];
  for (const part of path.split('/')) {
    const idMatch = part.match(/^(.+)\[id=(.+)\]$/);
    if (idMatch) {
      const key = idMatch[1]!;
      const id = idMatch[2]!;
      const arr = getByPath(root, [...out, key]);
      if (!Array.isArray(arr)) return out;
      let idx: number;
      if (id.startsWith('__idx_')) {
        idx = Number(id.slice(6));
      } else {
        idx = arr.findIndex((item) => isObject(item) && item.id === id);
      }
      if (idx < 0 || idx >= arr.length) return out;
      out.push(key, idx);
      continue;
    }
    if (/^\d+$/.test(part)) {
      out.push(Number(part));
      continue;
    }
    out.push(part);
  }
  return out;
}

function moduleTypeAtPath(root: unknown, pathKeys: PathSegment[]): string | undefined {
  const modulesIdx = pathKeys.indexOf('modules');
  if (modulesIdx < 0 || modulesIdx + 1 >= pathKeys.length) return undefined;
  const mod = getByPath(root, pathKeys.slice(0, modulesIdx + 2));
  if (!isObject(mod)) return undefined;
  return typeof mod.type === 'string' ? mod.type : undefined;
}

function itemIndexAtPath(pathKeys: PathSegment[]): number | undefined {
  const itemsIdx = pathKeys.indexOf('items');
  if (itemsIdx < 0 || itemsIdx + 1 >= pathKeys.length) return undefined;
  const idx = pathKeys[itemsIdx + 1];
  return typeof idx === 'number' ? idx : undefined;
}

function buildLabel(pathKeys: PathSegment[], type: SemanticDiffType, root: unknown): string {
  const moduleType = moduleTypeAtPath(root, pathKeys);
  const moduleLabel = moduleType ? MODULE_LABELS[moduleType] ?? moduleType : '';
  const last = pathKeys[pathKeys.length - 1];
  const field = typeof last === 'string' ? FIELD_LABELS[last] ?? last : '';
  const itemIdx = itemIndexAtPath(pathKeys);
  if (type === 'MODULE_ADDED' || type === 'MODULE_DELETED') {
    return moduleLabel ? `${moduleLabel} · 整模块` : '模块';
  }
  if (type === 'ITEM_ADDED' || type === 'ITEM_DELETED') {
    return moduleLabel ? `${moduleLabel} · 第 ${(itemIdx ?? 0) + 1} 条` : '条目';
  }
  if (pathKeys.length === 1 && last === 'name') return FIELD_LABELS.name;
  if (pathKeys[0] === 'globalStyle') return `全局样式 · ${field}`;
  if (moduleLabel && itemIdx != null) return `${moduleLabel} · 第 ${itemIdx + 1} 条 · ${field}`;
  if (moduleLabel) return `${moduleLabel} · ${field}`;
  return field || pathKeys.join('.');
}

function resolvePathKeysForDiff(diff: SemanticDiff, current: unknown, proposed: unknown): PathSegment[] {
  const fromCurrent = resolveSemanticPath(diff.path, current);
  const fromProposed = resolveSemanticPath(diff.path, proposed);
  if (diff.type === 'MODULE_DELETED' || diff.type === 'ITEM_DELETED') {
    return fromCurrent.length >= fromProposed.length ? fromCurrent : fromProposed;
  }
  if (diff.type === 'MODULE_ADDED' || diff.type === 'ITEM_ADDED') {
    return fromProposed.length >= fromCurrent.length ? fromProposed : fromCurrent;
  }
  return fromProposed.length >= fromCurrent.length ? fromProposed : fromCurrent;
}

function semanticToResumeDiff(diff: SemanticDiff, current: unknown, proposed: unknown): ResumeDiff | null {
  const pathKeys = resolvePathKeysForDiff(diff, current, proposed);
  if (!pathKeys.length && diff.path && diff.path !== 'root') return null;
  const root = proposed ?? current;
  const label = buildLabel(pathKeys, diff.type, root);
  const kind = semanticTypeToKind(diff.type, diff.oldValue, diff.newValue);
  const id = diff.path || pathKey(pathKeys);
  return {
    id,
    label,
    pathKeys,
    kind,
    oldValue: diff.oldValue,
    newValue: diff.newValue,
    oldDisplay: formatDisplayValue(diff.oldValue),
    newDisplay: formatDisplayValue(diff.newValue),
  };
}

export function diffResumeJson(current: unknown, proposed: unknown): ResumeDiff[] {
  return semanticJsonDiff(current, proposed)
    .map((d) => semanticToResumeDiff(d, current, proposed))
    .filter((d): d is ResumeDiff => d !== null);
}

type ModuleItemPath = {
  itemsPath: PathSegment[];
  itemIndex: number;
  itemPath: PathSegment[];
  key: string;
};

function parseModuleItemPath(pathKeys: PathSegment[]): ModuleItemPath | null {
  const itemsIdx = pathKeys.lastIndexOf('items');
  if (itemsIdx < 0 || itemsIdx + 1 >= pathKeys.length) return null;
  const itemIndex = pathKeys[itemsIdx + 1];
  if (typeof itemIndex !== 'number') return null;
  const itemPath = pathKeys.slice(0, itemsIdx + 2);
  return {
    itemsPath: pathKeys.slice(0, itemsIdx + 1),
    itemIndex,
    itemPath,
    key: pathKey(itemPath),
  };
}

function normalizeResume(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function setByPathCreate(root: unknown, path: PathSegment[], value: unknown): void {
  if (!path.length || root == null || typeof root !== 'object') return;
  let cur: unknown = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    const nextKey = path[i + 1];
    if (Array.isArray(cur)) {
      if (typeof key !== 'number') return;
      let next = cur[key];
      if (next == null || typeof next !== 'object') {
        next = typeof nextKey === 'number' ? [] : {};
        cur[key] = next;
      }
      cur = next;
      continue;
    }
    const obj = cur as Record<string, unknown>;
    let next = obj[key as string];
    if (next == null || typeof next !== 'object') {
      next = typeof nextKey === 'number' ? [] : {};
      obj[key as string] = next;
    }
    cur = next;
  }
  const last = path[path.length - 1]!;
  if (Array.isArray(cur)) {
    if (typeof last === 'number') cur[last] = value;
    return;
  }
  (cur as Record<string, unknown>)[last as string] = value;
}

function insertProposedItem(
  root: unknown,
  itemsPath: PathSegment[],
  index: number,
  proposedItem: unknown,
): void {
  const items = getByPath(root, itemsPath);
  if (!Array.isArray(items) || proposedItem == null || typeof proposedItem !== 'object') return;
  const copy = JSON.parse(JSON.stringify(proposedItem));
  if (index === items.length) {
    items.push(copy);
    return;
  }
  if (index >= 0 && index < items.length) {
    items[index] = copy;
  }
}

function removeItemsAtIndexes(root: unknown, itemsPath: PathSegment[], indexes: number[]): void {
  const items = getByPath(root, itemsPath);
  if (!Array.isArray(items)) return;
  for (const index of [...indexes].sort((a, b) => b - a)) {
    if (index >= 0 && index < items.length) items.splice(index, 1);
  }
}

function removeModuleAtPath(root: unknown, pathKeys: PathSegment[]): void {
  const modulesIdx = pathKeys.indexOf('modules');
  if (modulesIdx < 0 || modulesIdx + 1 >= pathKeys.length) return;
  const modIdx = pathKeys[modulesIdx + 1];
  if (typeof modIdx !== 'number') return;
  const modules = getByPath(root, pathKeys.slice(0, modulesIdx + 1));
  if (!Array.isArray(modules)) return;
  if (modIdx >= 0 && modIdx < modules.length) modules.splice(modIdx, 1);
}

function insertProposedModule(root: unknown, pathKeys: PathSegment[], proposedModule: unknown): void {
  const modulesIdx = pathKeys.indexOf('modules');
  if (modulesIdx < 0) return;
  const modules = getByPath(root, pathKeys.slice(0, modulesIdx + 1));
  if (!Array.isArray(modules) || proposedModule == null) return;
  modules.push(JSON.parse(JSON.stringify(proposedModule)));
}

export function applyResumeDiffs(
  config: unknown,
  proposed: unknown,
  diffs: ResumeDiff[],
  selectedIds: string[],
): unknown {
  const next = normalizeResume(config);
  const pick = new Set(selectedIds);
  const mergedNewItems = new Set<string>();
  const removedItemKeys = new Set<string>();
  const removalsByArray = new Map<string, { itemsPath: PathSegment[]; indexes: Set<number> }>();

  for (const diff of diffs) {
    if (!pick.has(diff.id)) continue;
    if (
      diff.kind === 'add'
      && diff.pathKeys.includes('modules')
      && !diff.pathKeys.includes('items')
      && isObject(diff.newValue)
      && 'type' in diff.newValue
    ) {
      insertProposedModule(next, diff.pathKeys, diff.newValue);
      continue;
    }
    if (
      diff.kind === 'remove'
      && diff.pathKeys.includes('modules')
      && !diff.pathKeys.includes('items')
      && isObject(diff.oldValue)
      && 'type' in diff.oldValue
    ) {
      removeModuleAtPath(next, diff.pathKeys);
      continue;
    }
    const parsed = parseModuleItemPath(diff.pathKeys);
    if (!parsed) continue;
    const currentItems = getByPath(next, parsed.itemsPath);
    const proposedItems = getByPath(proposed, parsed.itemsPath);
    if (!Array.isArray(currentItems) || !Array.isArray(proposedItems)) continue;
    const isWholeItemRemove = diff.kind === 'remove' && diff.pathKeys.length === parsed.itemPath.length;
    if (isWholeItemRemove && parsed.itemIndex < currentItems.length) {
      removedItemKeys.add(parsed.key);
      const arrayKey = pathKey(parsed.itemsPath);
      const bucket = removalsByArray.get(arrayKey) ?? { itemsPath: parsed.itemsPath, indexes: new Set<number>() };
      bucket.indexes.add(parsed.itemIndex);
      removalsByArray.set(arrayKey, bucket);
      continue;
    }
    if (parsed.itemIndex >= currentItems.length && parsed.itemIndex < proposedItems.length) {
      if (mergedNewItems.has(parsed.key)) continue;
      const proposedItem = getByPath(proposed, parsed.itemPath);
      insertProposedItem(next, parsed.itemsPath, parsed.itemIndex, proposedItem);
      mergedNewItems.add(parsed.key);
      continue;
    }
    if (parsed.itemIndex < currentItems.length && parsed.itemIndex >= proposedItems.length) {
      removedItemKeys.add(parsed.key);
      const arrayKey = pathKey(parsed.itemsPath);
      const bucket = removalsByArray.get(arrayKey) ?? { itemsPath: parsed.itemsPath, indexes: new Set<number>() };
      bucket.indexes.add(parsed.itemIndex);
      removalsByArray.set(arrayKey, bucket);
    }
  }

  for (const { itemsPath, indexes } of Array.from(removalsByArray.values())) {
    removeItemsAtIndexes(next, itemsPath, Array.from(indexes));
  }

  for (const diff of diffs) {
    if (!pick.has(diff.id)) continue;
    if (
      diff.kind === 'add'
      && diff.pathKeys.includes('modules')
      && !diff.pathKeys.includes('items')
      && isObject(diff.newValue)
      && 'type' in diff.newValue
    ) continue;
    if (
      diff.kind === 'remove'
      && diff.pathKeys.includes('modules')
      && !diff.pathKeys.includes('items')
      && isObject(diff.oldValue)
      && 'type' in diff.oldValue
    ) continue;
    const parsed = parseModuleItemPath(diff.pathKeys);
    if (parsed && (mergedNewItems.has(parsed.key) || removedItemKeys.has(parsed.key))) continue;
    if (diff.kind === 'add' && parsed && parsed.itemIndex >= ((getByPath(next, parsed.itemsPath) as unknown[] | undefined)?.length ?? 0)) {
      const proposedItem = getByPath(proposed, parsed.itemPath);
      insertProposedItem(next, parsed.itemsPath, parsed.itemIndex, proposedItem);
      continue;
    }
    const val = getByPath(proposed, diff.pathKeys);
    setByPathCreate(next, diff.pathKeys, val);
  }
  return next;
}
