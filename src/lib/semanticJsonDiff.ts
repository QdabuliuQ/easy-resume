export type SemanticDiffType =
  | 'MODULE_DELETED'
  | 'MODULE_ADDED'
  | 'FIELD_MODIFIED'
  | 'ITEM_ADDED'
  | 'ITEM_DELETED';

export type SemanticDiff = {
  path: string;
  type: SemanticDiffType;
  oldValue: unknown;
  newValue: unknown;
};

const LIST_ITEM_MODULE_TYPES = new Set(['job', 'project', 'education', 'certificate']);
const SKIP_KEYS = new Set(['avatar', 'type']);

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === 'string' && !v.trim());
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function joinPath(base: string, key: string | number): string {
  const seg = String(key);
  return base ? `${base}/${seg}` : seg;
}

function itemKey(item: Record<string, unknown>, index: number): string {
  const id = item.id;
  return typeof id === 'string' && id ? id : `__idx_${index}`;
}

function uniqueKeys(...objects: Record<string, unknown>[]): string[] {
  const keys: string[] = [];
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      if (!keys.includes(key)) keys.push(key);
    }
  }
  return keys;
}

function handleListDiff(
  oldList: unknown[],
  newList: unknown[],
  path: string,
  diffs: SemanticDiff[],
): void {
  const oldMap = new Map<string, unknown>();
  oldList.forEach((item, i) => {
    if (isObject(item)) oldMap.set(itemKey(item, i), item);
  });
  const newIds = new Set<string>();
  newList.forEach((newItem, i) => {
    if (!isObject(newItem)) return;
    const id = itemKey(newItem, i);
    newIds.add(id);
    const itemPath = `${path}[id=${id}]`;
    const oldItem = oldMap.get(id);
    if (!oldItem) {
      diffs.push({ path: itemPath, type: 'ITEM_ADDED', oldValue: null, newValue: newItem });
    } else {
      compare(oldItem, newItem, itemPath, diffs, []);
    }
  });
  oldList.forEach((oldItem, i) => {
    if (!isObject(oldItem)) return;
    const id = itemKey(oldItem, i);
    if (!newIds.has(id)) {
      diffs.push({
        path: `${path}[id=${id}]`,
        type: 'ITEM_DELETED',
        oldValue: oldItem,
        newValue: null,
      });
    }
  });
}

function handleModulesDiff(
  oldModules: unknown[],
  newModules: unknown[],
  path: string,
  diffs: SemanticDiff[],
): void {
  const oldMap = new Map<string, unknown>();
  oldModules.forEach((m, i) => {
    if (isObject(m)) oldMap.set(itemKey(m, i), m);
  });
  const newIds = new Set<string>();
  newModules.forEach((newMod, i) => {
    if (!isObject(newMod)) return;
    const id = itemKey(newMod, i);
    newIds.add(id);
    const modPath = `${path}[id=${id}]`;
    const oldMod = oldMap.get(id);
    if (!oldMod) {
      diffs.push({ path: modPath, type: 'MODULE_ADDED', oldValue: null, newValue: newMod });
      return;
    }
    compareModule(oldMod, newMod, modPath, diffs);
  });
  oldModules.forEach((oldMod, i) => {
    if (!isObject(oldMod)) return;
    const id = itemKey(oldMod, i);
    if (!newIds.has(id)) {
      diffs.push({
        path: `${path}[id=${id}]`,
        type: 'MODULE_DELETED',
        oldValue: oldMod,
        newValue: null,
      });
    }
  });
}

function compareModule(
  oldMod: unknown,
  newMod: unknown,
  path: string,
  diffs: SemanticDiff[],
): void {
  if (!isObject(oldMod) || !isObject(newMod)) {
    compare(oldMod, newMod, path, diffs, []);
    return;
  }
  const modType = typeof newMod.type === 'string' ? newMod.type : typeof oldMod.type === 'string' ? oldMod.type : '';
  for (const key of uniqueKeys(oldMod, newMod)) {
    if (key === 'id' || key === 'type') continue;
    const currentPath = joinPath(path, key);
    const oldVal = oldMod[key];
    const newVal = newMod[key];
    if (key === 'options' && isObject(oldVal) && isObject(newVal)) {
      compareModuleOptions(oldVal, newVal, currentPath, diffs, modType);
    } else {
      compare(oldVal, newVal, currentPath, diffs, []);
    }
  }
}

function compareModuleOptions(
  oldOpts: Record<string, unknown>,
  newOpts: Record<string, unknown>,
  path: string,
  diffs: SemanticDiff[],
  modType: string,
): void {
  for (const key of uniqueKeys(oldOpts, newOpts)) {
    if (SKIP_KEYS.has(key)) continue;
    const currentPath = joinPath(path, key);
    const oldVal = oldOpts[key];
    const newVal = newOpts[key];
    if (key === 'items' && LIST_ITEM_MODULE_TYPES.has(modType)
      && Array.isArray(oldVal) && Array.isArray(newVal)) {
      handleListDiff(oldVal, newVal, currentPath, diffs);
    } else {
      compare(oldVal, newVal, currentPath, diffs, []);
    }
  }
}

function compare(
  oldObj: unknown,
  newObj: unknown,
  path: string,
  diffs: SemanticDiff[],
  listKeys: string[],
): void {
  if (!isEmpty(oldObj) && isEmpty(newObj)) {
    diffs.push({ path: path || 'root', type: 'MODULE_DELETED', oldValue: oldObj, newValue: null });
    return;
  }
  if (isEmpty(oldObj) && !isEmpty(newObj)) {
    diffs.push({ path: path || 'root', type: 'MODULE_ADDED', oldValue: null, newValue: newObj });
    return;
  }
  if (isEmpty(oldObj) && isEmpty(newObj)) return;
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    if (path.endsWith('/modules')) {
      handleModulesDiff(oldObj, newObj, path, diffs);
      return;
    }
    if (path.endsWith('/items')) {
      handleListDiff(oldObj, newObj, path, diffs);
      return;
    }
    const len = Math.max(oldObj.length, newObj.length);
    for (let i = 0; i < len; i++) {
      compare(oldObj[i], newObj[i], joinPath(path, i), diffs, listKeys);
    }
    return;
  }
  if (!isObject(oldObj) || !isObject(newObj)) {
    if (!valuesEqual(oldObj, newObj)) {
      diffs.push({ path, type: 'FIELD_MODIFIED', oldValue: oldObj, newValue: newObj });
    }
    return;
  }
  for (const key of uniqueKeys(oldObj, newObj)) {
    if (SKIP_KEYS.has(key)) continue;
    const currentPath = joinPath(path, key);
    const oldVal = oldObj[key];
    const newVal = newObj[key];
    if (key === 'modules' && Array.isArray(oldVal) && Array.isArray(newVal)) {
      handleModulesDiff(oldVal, newVal, currentPath, diffs);
    } else if (listKeys.includes(key) && Array.isArray(oldVal) && Array.isArray(newVal)) {
      handleListDiff(oldVal, newVal, currentPath, diffs);
    } else {
      compare(oldVal, newVal, currentPath, diffs, listKeys);
    }
  }
}

export function semanticJsonDiff(oldData: unknown, newData: unknown): SemanticDiff[] {
  const diffs: SemanticDiff[] = [];
  const listKeys = ['job', 'project', 'education', 'certificate'];
  compare(
    JSON.parse(JSON.stringify(oldData ?? {})),
    JSON.parse(JSON.stringify(newData ?? {})),
    '',
    diffs,
    listKeys,
  );
  return diffs;
}

export function isEmptyValue(v: unknown): boolean {
  return isEmpty(v);
}
