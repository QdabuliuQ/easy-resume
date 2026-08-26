import {
  city,
  degree,
  ethnic,
  gender,
  intentCity,
  maritalStatus,
  origin,
  politicalStatus,
  schoolType,
  status,
} from '@/modules/utils/constant';
import type { ParsedItemTarget } from './parseItemTarget';

export type InlineFieldKind =
  | 'text'
  | 'select'
  | 'multiSelect'
  | 'cascader'
  | 'cascaderMulti'
  | 'date'
  | 'dateRange'
  | 'richText'
  | 'salary';

export type InlineFieldMeta = {
  kind: InlineFieldKind;
  options?: { label: string; value: string | number }[];
  maxLength?: number;
};

const INFO1_SELECT = new Set(['status', 'gender', 'ethnic', 'maritalStatus', 'politicalStatus']);
const INFO1_CASCADER = new Set(['city', 'origin']);
const ITEM_RICH = new Set(['description']);
const ITEM_CITY = new Set(['city']);

export function resolveFieldMeta(
  moduleType: string,
  target: ParsedItemTarget,
): InlineFieldMeta | null {
  const field = target.field;
  if (!field) return null;

  if (moduleType === 'info1') {
    if (field === 'expectedSalary') return { kind: 'salary', maxLength: 30 };
    if (INFO1_SELECT.has(field)) {
      const map: Record<string, { label: string; value: string | number }[]> = {
        status,
        gender,
        ethnic,
        maritalStatus,
        politicalStatus,
      };
      return { kind: 'select', options: map[field] };
    }
    if (field === 'intentCity') return { kind: 'cascaderMulti', options: intentCity };
    if (INFO1_CASCADER.has(field)) {
      return { kind: 'cascader', options: field === 'origin' ? origin : city };
    }
    if (field === 'birthday') return { kind: 'date' };
    if (field === 'name') return { kind: 'text', maxLength: 30 };
    return { kind: 'text', maxLength: 30 };
  }

  if (moduleType === 'skill' || moduleType === 'other') {
    if (field === 'description') return { kind: 'richText' };
    return null;
  }

  if (target.optionIndex == null) return null;

  if (field === 'date') {
    return moduleType === 'certificate' ? { kind: 'date' } : { kind: 'dateRange' };
  }
  if (ITEM_RICH.has(field)) return { kind: 'richText' };

  if (moduleType === 'education') {
    if (field === 'degree') return { kind: 'select', options: degree };
    if (field === 'tags') return { kind: 'multiSelect', options: schoolType };
  }

  if (ITEM_CITY.has(field)) return { kind: 'cascader', options: city };

  if (
    field === 'company' ||
    field === 'post' ||
    field === 'department' ||
    field === 'school' ||
    field === 'major' ||
    field === 'academy' ||
    field === 'name' ||
    field === 'role'
  ) {
    return { kind: 'text', maxLength: 30 };
  }

  return { kind: 'text', maxLength: 30 };
}

export function popoverSizeForKind(kind: InlineFieldKind): { width: number; height: number } {
  switch (kind) {
    case 'richText':
      return { width: 480, height: 400 };
    case 'dateRange':
      return { width: 320, height: 56 };
    case 'salary':
      return { width: 280, height: 48 };
    case 'cascader':
    case 'cascaderMulti':
      return { width: 300, height: 48 };
    case 'multiSelect':
      return { width: 300, height: 56 };
    default:
      return { width: 280, height: 44 };
  }
}
