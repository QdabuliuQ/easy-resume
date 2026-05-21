import type { ResumeAiFieldOptimize } from '@/api/resumeAiScoreAnalyze';

export const RESUME_ITEMS_MODULE_TYPES = ['job', 'project', 'education', 'certificate'] as const;

function tokenizeFieldKey(fieldKey: string): (string | number)[] {
  const out: (string | number)[] = [];
  const re = /([^[\].]+)|\[(\d+)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fieldKey))) {
    if (m[1] !== undefined) out.push(m[1]);
    else out.push(Number(m[2]));
  }
  return out;
}

function setOptionsByFieldKey(options: Record<string, unknown>, fieldKey: string, value: unknown) {
  const tokens = tokenizeFieldKey(fieldKey);
  if (tokens.length === 0) {
    options[fieldKey] = value;
    return;
  }
  let cur: unknown = options;
  for (let i = 0; i < tokens.length - 1; i++) {
    const key = tokens[i];
    const nextTok = tokens[i + 1];
    let child: unknown = Array.isArray(cur)
      ? (cur as unknown[])[key as number]
      : (cur as Record<string, unknown>)[String(key)];
    if (child == null || typeof child !== 'object') {
      child = typeof nextTok === 'number' ? [] : {};
      if (Array.isArray(cur)) (cur as unknown[])[key as number] = child;
      else (cur as Record<string, unknown>)[String(key)] = child as object;
    }
    cur = child;
  }
  const last = tokens[tokens.length - 1];
  if (Array.isArray(cur)) (cur as unknown[])[last as number] = value;
  else (cur as Record<string, unknown>)[String(last)] = value;
}

type ResumeModule = {
  id: string;
  type: string;
  options?: Record<string, unknown>;
};

type ResumeDraft = {
  pages?: { modules?: ResumeModule[] }[];
};

export function findResumeModule(
  draft: ResumeDraft,
  pageIndex: number,
  moduleId: string,
): ResumeModule | undefined {
  return draft.pages?.[pageIndex]?.modules?.find((m) => m.id === moduleId);
}

export function resumeModuleItemLabel(
  mod: ResumeModule | undefined,
  moduleItemId: string | undefined,
): string | null {
  const id = moduleItemId?.trim();
  if (!id || !mod?.options?.items || !Array.isArray(mod.options.items)) return null;
  const row = mod.options.items.find(
    (it) => it && typeof it === 'object' && String((it as { id?: string }).id) === id,
  ) as Record<string, unknown> | undefined;
  if (!row) return null;
  const label =
    row.company ?? row.name ?? row.school ?? row.major ?? row.post ?? row.role ?? null;
  return typeof label === 'string' && label.trim() ? label.trim() : null;
}

export function applyResumeAiFieldOptimize(draft: ResumeDraft, item: ResumeAiFieldOptimize): boolean {
  const mod = findResumeModule(draft, item.pageIndex, item.moduleId);
  if (!mod?.options || typeof mod.options !== 'object') return false;
  const opts = { ...(mod.options as Record<string, unknown>) };
  const itemId = item.moduleItemId?.trim();
  if (
    itemId &&
    (RESUME_ITEMS_MODULE_TYPES as readonly string[]).includes(mod.type) &&
    Array.isArray(opts.items)
  ) {
    const items = opts.items.map((it) =>
      it && typeof it === 'object' ? { ...(it as Record<string, unknown>) } : it,
    );
    const row = items.find(
      (it) => it && typeof it === 'object' && String((it as { id?: string }).id) === itemId,
    ) as Record<string, unknown> | undefined;
    if (!row) return false;
    row[item.fieldKey] = item.optimizeValue;
    opts.items = items;
    mod.options = opts;
    return true;
  }
  if (
    itemId &&
    (RESUME_ITEMS_MODULE_TYPES as readonly string[]).includes(mod.type)
  ) {
    return false;
  }
  setOptionsByFieldKey(opts, item.fieldKey, item.optimizeValue);
  mod.options = opts;
  return true;
}

export function fieldOptimizeListKey(item: ResumeAiFieldOptimize): string {
  return `${item.pageIndex}-${item.moduleId}-${item.moduleItemId ?? ''}-${item.fieldKey}`;
}
