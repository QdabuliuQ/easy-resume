export type ParsedItemTarget = {
  moduleId: string;
  optionIndex: number | null;
  field: string | null;
  fieldPath: string | null;
};

/** 期望薪资预览区 _0 / _1，对应 Popover 内第几个 Input */
export function salaryFocusIndexFromTarget(target: ParsedItemTarget): 0 | 1 {
  if (target.field !== 'expectedSalary') return 0;
  return target.fieldPath?.endsWith('_1') ? 1 : 0;
}

export function resolveModuleIdFromItemId(itemId: string, moduleIds: string[]): string | null {
  let hit: string | null = null;
  for (const id of moduleIds) {
    if (itemId === id || itemId.startsWith(`${id}_`)) {
      if (!hit || id.length > hit.length) hit = id;
    }
  }
  return hit;
}

export function parseItemTargetFromItemId(
  itemId: string,
  moduleIds: string[],
): ParsedItemTarget | null {
  const segments = itemId.split('_').filter(Boolean);
  if (!segments.length) return null;

  const first = segments[0];
  const moduleId = moduleIds.includes(first)
    ? first
    : resolveModuleIdFromItemId(itemId, moduleIds);
  if (!moduleId) return null;

  const rest =
    moduleId === first
      ? segments.slice(1)
      : itemId.startsWith(`${moduleId}_`)
        ? itemId
            .slice(moduleId.length + 1)
            .split('_')
            .filter(Boolean)
        : [];

  if (!rest.length) {
    return { moduleId, optionIndex: null, field: null, fieldPath: null };
  }

  const second = rest[0];
  if (/^\d+$/.test(second)) {
    const tail = rest.slice(1);
    return {
      moduleId,
      optionIndex: Number(second),
      field: tail[0] ?? null,
      fieldPath: tail.length ? tail.join('_') : null,
    };
  }

  return {
    moduleId,
    optionIndex: null,
    field: second,
    fieldPath: rest.join('_'),
  };
}
