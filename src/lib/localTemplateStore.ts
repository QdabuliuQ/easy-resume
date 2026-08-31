import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resumeTemplates, type ResumeTemplateItem } from '@/json/resumeTemplates';

export type LocalTemplateRecord = ResumeTemplateItem & {
  description?: string;
  category?: string;
  status?: 'draft' | 'published' | 'offline';
  sortOrder?: number;
  previewImage?: string;
  updatedAt?: number;
};

type TemplateOverrides = Record<string, Partial<LocalTemplateRecord>>;

const baseById = new Map(resumeTemplates.map((t) => [t.id, t]));

function getOverridesPath() {
  return (
    process.env.TEMPLATE_OVERRIDES_PATH ||
    path.join(process.cwd(), 'src/json/template-overrides.json')
  );
}

async function readOverrides(): Promise<TemplateOverrides> {
  try {
    const raw = await readFile(getOverridesPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as TemplateOverrides) : {};
  } catch {
    return {};
  }
}

async function writeOverrides(overrides: TemplateOverrides): Promise<void> {
  await writeFile(getOverridesPath(), `${JSON.stringify(overrides, null, 2)}\n`, 'utf8');
}

function mergeTemplate(base: ResumeTemplateItem, override?: Partial<LocalTemplateRecord>): LocalTemplateRecord {
  return {
    ...base,
    ...override,
    id: base.id,
    config: override?.config ?? base.config,
    status: override?.status ?? 'published',
    sortOrder: override?.sortOrder ?? 0,
  };
}

function isFullCustom(entry: Partial<LocalTemplateRecord> | undefined, id: string): entry is LocalTemplateRecord {
  if (!entry || baseById.has(id)) return false;
  const cfg = entry.config;
  return (
    typeof entry.title === 'string' &&
    !!cfg &&
    typeof cfg === 'object' &&
    Array.isArray((cfg as LocalTemplateRecord['config']).pages)
  );
}

function customFromOverride(id: string, entry: LocalTemplateRecord): LocalTemplateRecord {
  return {
    ...entry,
    id,
    status: entry.status ?? 'published',
    sortOrder: entry.sortOrder ?? 0,
  };
}

export async function listLocalTemplates(): Promise<LocalTemplateRecord[]> {
  const overrides = await readOverrides();
  const list: LocalTemplateRecord[] = resumeTemplates.map((template) =>
    mergeTemplate(template, overrides[template.id]),
  );
  for (const [id, entry] of Object.entries(overrides)) {
    if (baseById.has(id) || !isFullCustom(entry, id)) continue;
    list.push(customFromOverride(id, entry));
  }
  return list
    .filter((template) => template.status !== 'offline')
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function getLocalTemplate(id: string): Promise<LocalTemplateRecord | null> {
  const overrides = await readOverrides();
  const base = baseById.get(id);
  if (base) {
    const merged = mergeTemplate(base, overrides[id]);
    return merged.status === 'offline' ? null : merged;
  }
  const entry = overrides[id];
  if (!isFullCustom(entry, id)) return null;
  const record = customFromOverride(id, entry);
  return record.status === 'offline' ? null : record;
}

export async function saveLocalTemplate(
  id: string,
  patch: Partial<LocalTemplateRecord>,
): Promise<LocalTemplateRecord | null> {
  const overrides = await readOverrides();
  const base = baseById.get(id);
  if (base) {
    overrides[id] = {
      ...(overrides[id] ?? {}),
      ...patch,
      updatedAt: Date.now(),
    };
    await writeOverrides(overrides);
    return mergeTemplate(base, overrides[id]);
  }
  const existing = overrides[id];
  if (!isFullCustom(existing, id) && !patch.config) return null;
  const next: LocalTemplateRecord = {
    id,
    title: (typeof patch.title === 'string' ? patch.title : existing?.title) || id,
    config: (patch.config ?? existing?.config) as LocalTemplateRecord['config'],
    description: patch.description ?? existing?.description,
    category: patch.category ?? existing?.category,
    status: patch.status ?? existing?.status ?? 'published',
    sortOrder: patch.sortOrder ?? existing?.sortOrder ?? 0,
    previewImage: patch.previewImage ?? existing?.previewImage,
    updatedAt: Date.now(),
  };
  overrides[id] = next;
  await writeOverrides(overrides);
  return next;
}

export function slugifyTemplateId(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return s || `tpl-${Date.now()}`;
}

export async function createLocalTemplate(input: {
  id?: string;
  title: string;
  config: LocalTemplateRecord['config'];
  description?: string;
  category?: string;
}): Promise<LocalTemplateRecord> {
  const title = input.title.trim();
  if (!title) throw new Error('标题不能为空');
  const id = (input.id?.trim() || slugifyTemplateId(title)).slice(0, 64);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(id)) {
    throw new Error('ID 仅支持字母数字、下划线与连字符');
  }
  const overrides = await readOverrides();
  if (baseById.has(id) || overrides[id]) throw new Error('模板 ID 已存在');
  const record: LocalTemplateRecord = {
    id,
    title,
    config: input.config,
    description: input.description,
    category: input.category,
    status: 'published',
    sortOrder: 0,
    updatedAt: Date.now(),
  };
  overrides[id] = record;
  await writeOverrides(overrides);
  return record;
}

export async function deleteLocalTemplate(id: string): Promise<boolean> {
  const overrides = await readOverrides();
  if (baseById.has(id)) {
    overrides[id] = {
      ...(overrides[id] ?? {}),
      status: 'offline',
      updatedAt: Date.now(),
    };
    await writeOverrides(overrides);
    return true;
  }
  if (!(id in overrides)) return false;
  delete overrides[id];
  await writeOverrides(overrides);
  return true;
}
