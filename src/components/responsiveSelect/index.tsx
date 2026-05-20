'use client';

import { Select, type SelectProps } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import MobileCheckListPicker, {
  type MobileSelectOption,
} from '@/components/mobileCheckListPicker';
import { useMobileEdit } from '@/views/edit/mobile/context';

function flattenOption(item: DefaultOptionType): MobileSelectOption[] {
  if ('options' in item && Array.isArray(item.options)) {
    return item.options.flatMap((o) => flattenOption(o));
  }
  return [
    {
      value: item.value as string | number,
      label: item.label ?? String(item.value ?? ''),
      disabled: item.disabled,
    },
  ];
}

function toMobileOptions(options: SelectProps['options']): MobileSelectOption[] {
  if (!options) return [];
  const out: MobileSelectOption[] = [];
  for (const item of options) {
    if (item == null) continue;
    if (typeof item !== 'object') {
      const v = item as string | number;
      out.push({ value: v, label: v });
      continue;
    }
    out.push(...flattenOption(item as DefaultOptionType));
  }
  return out;
}

export default function ResponsiveSelect(props: SelectProps) {
  const mobile = useMobileEdit();
  if (!mobile) return <Select {...props} />;
  return (
    <MobileCheckListPicker
      value={props.value as string | number | (string | number)[] | undefined}
      defaultValue={props.defaultValue as string | number | (string | number)[] | undefined}
      onChange={props.onChange as (v: string | number | (string | number)[]) => void}
      options={toMobileOptions(props.options)}
      placeholder={typeof props.placeholder === 'string' ? props.placeholder : undefined}
      disabled={props.disabled}
      multiple={props.mode === 'multiple'}
      style={props.style}
    />
  );
}
