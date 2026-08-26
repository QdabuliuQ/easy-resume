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

function itemRecord(module: any, index: number) {
  return module?.options?.items?.[index] ?? null;
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

  const item = target.optionIndex == null ? null : itemRecord(module, target.optionIndex);
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
  const config = JSON.parse(JSON.stringify(source));
  const module = config.pages[loc.page].modules[loc.module];
  const field = target.field;
  if (!field) return;

  if (moduleType === 'info1') {
    if (kind === 'salary' && Array.isArray(value)) {
      module.options.expectedSalary = value;
    } else {
      module.options[field] = value;
    }
    configStore.setConfig({ ...config, pages: [...config.pages] });
    return;
  }

  if (moduleType === 'skill' || moduleType === 'other') {
    module.options.description = value;
    configStore.setConfig({ ...config, pages: [...config.pages] });
    return;
  }

  const item = target.optionIndex == null ? null : itemRecord(module, target.optionIndex);
  if (!item) return;

  if (kind === 'date') {
    item.date = value;
  } else if (kind === 'dateRange') {
    const v = value as { startDate?: string; endDate?: string };
    item.startDate = v.startDate ?? '';
    item.endDate = v.endDate ?? '';
  } else if (kind === 'cascader' && field === 'city') {
    item.city = Array.isArray(value) ? value.join(' - ') : value;
  } else {
    item[field] = value;
  }

  configStore.setConfig({ ...config, pages: [...config.pages] });
}
