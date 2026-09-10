import { configStore } from '@/mobx';
import type { ParsedItemTarget } from './parseItemTarget';
import type { InlineFieldKind } from './resolveFieldMeta';

export type ModuleLoc = { page: number; module: number };

export function findModuleLoc(moduleId: string): ModuleLoc | null {
  const config = configStore.getConfig;
  if (!config) return null;
  for (let page = 0; page < config.pages.length; page += 1) {
    for (let module = 0; module < config.pages[page].modules.length; module += 1) {
      if (config.pages[page].modules[module].id === moduleId) {
        return { page, module };
      }
    }
  }
  return null;
}

function itemRecord(module: any, target: ParsedItemTarget) {
  const items = module?.options?.items;
  if (!Array.isArray(items)) return null;
  if (target.itemId) {
    return items.find((item: any) => item?.id === target.itemId) ?? null;
  }
  return target.optionIndex == null ? null : items[target.optionIndex] ?? null;
}

export function readInlineField(
  module: any,
  moduleType: string,
  target: ParsedItemTarget,
  kind: InlineFieldKind,
): unknown {
  const field = target.field;
  if (!field || !module) return '';

  if (moduleType === 'info1') {
    if (kind === 'salary') {
      const sal = module.options?.expectedSalary;
      return Array.isArray(sal) ? [sal[0] ?? '', sal[1] ?? ''] : ['', ''];
    }
    return module.options?.[field] ?? '';
  }

  if (moduleType === 'skill' || moduleType === 'other') {
    return module.options?.description ?? '';
  }

  const item = itemRecord(module, target);
  if (!item) return '';

  if (kind === 'date') {
    return item.date ?? '';
  }

  if (kind === 'dateRange') {
    return { startDate: item.startDate ?? '', endDate: item.endDate ?? '' };
  }

  if (kind === 'cascader' && field === 'city') {
    if (Array.isArray(item.city)) return item.city;
    if (typeof item.city === 'string' && item.city) return item.city.split(' - ');
    return [];
  }

  return item[field] ?? (field === 'tags' ? [] : '');
}

export function writeInlineField(
  loc: ModuleLoc,
  moduleType: string,
  target: ParsedItemTarget,
  kind: InlineFieldKind,
  value: unknown,
) {
  const source = configStore.getConfig;
  if (!source) return;
  const module = source.pages?.[loc.page]?.modules?.[loc.module];
  const field = target.field;
  if (!field || !module) return;

  if (moduleType === 'info1') {
    configStore.updateModuleField(module.id, kind === 'salary' ? 'expectedSalary' : field, value);
    return;
  }

  if (moduleType === 'skill' || moduleType === 'other') {
    configStore.updateModuleField(module.id, 'description', value);
    return;
  }

  const item = itemRecord(module, target);
  if (!item || !item.id) return;
  if (kind === 'date') {
    configStore.updateModuleField(module.id, ['items', item.id, 'date'], value);
  } else if (kind === 'dateRange') {
    const v = value as { startDate?: string; endDate?: string };
    configStore.updateModuleField(module.id, ['items', item.id], (current) => ({
      ...(current as Record<string, unknown>),
      startDate: v.startDate ?? '',
      endDate: v.endDate ?? '',
    }));
  } else if (kind === 'cascader' && field === 'city') {
    configStore.updateModuleField(module.id, ['items', item.id, 'city'], Array.isArray(value) ? value.join(' - ') : value);
  } else {
    configStore.updateModuleField(module.id, ['items', item.id, field], value);
  }
}
