'use client';
import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { MobileDatePicker, MobileRangeDatePicker } from '@/components/mobileDatePicker';
import { useMobileEdit } from '@/views/edit/mobile/context';

type SingleProps = {
  value?: Dayjs | null;
  defaultValue?: Dayjs | string | null;
  onChange?: (date: Dayjs | null, dateString?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  picker?: 'date' | 'month' | 'year';
  format?: string;
};

export function ResponsiveDatePicker(props: SingleProps) {
  const mobile = useMobileEdit();
  if (!mobile) {
    return (
      <DatePicker
        style={{ width: '100%', ...props.style }}
        value={props.value ?? undefined}
        defaultValue={props.defaultValue as Dayjs | undefined}
        placeholder={props.placeholder}
        disabled={props.disabled}
        picker={props.picker}
        format={props.format}
        onChange={(d, ds) =>
          props.onChange?.(d, Array.isArray(ds) ? ds[0] : ds)
        }
      />
    );
  }
  return (
    <MobileDatePicker
      value={props.value}
      defaultValue={props.defaultValue}
      placeholder={props.placeholder}
      disabled={props.disabled}
      style={props.style}
      picker={props.picker}
      format={props.format}
      onChange={(d, ds) => props.onChange?.(d, ds)}
    />
  );
}

type RangeProps = {
  value?: [Dayjs | undefined, Dayjs | undefined];
  onChange?: (dates: [Dayjs, Dayjs] | null) => void;
  placeholder?: [string, string];
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  format?: string;
};

export function ResponsiveRangeDatePicker(props: RangeProps) {
  const mobile = useMobileEdit();
  if (!mobile) {
    return (
      <DatePicker.RangePicker
        picker='month'
        style={{ width: '100%', ...props.style }}
        value={props.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        format={props.format ?? 'YYYY-MM'}
        onChange={(d) => props.onChange?.(d as [Dayjs, Dayjs] | null)}
      />
    );
  }
  return (
    <MobileRangeDatePicker
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      style={props.style}
      format={props.format}
      title={props.placeholder?.[0]}
      onChange={props.onChange}
    />
  );
}

export function toDayjsValue(v: unknown): Dayjs | undefined {
  if (v == null || v === '') return undefined;
  if (dayjs.isDayjs(v)) return v as Dayjs;
  const d = dayjs(v as string);
  return d.isValid() ? d : undefined;
}
