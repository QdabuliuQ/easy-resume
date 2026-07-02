'use client';
import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MobileDatePicker, MobileRangeDatePicker } from '@/components/mobileDatePicker';
import PresentEndAction from '@/components/responsiveDatePicker/presentEndAction';
import { isResumePresentEndDate } from '@/utils/resumeDateDisplay';
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

export type RangeDatePickerChangeMeta = {
  endIsPresent: boolean;
};

type RangeProps = {
  startDate?: string | null;
  endDate?: string | null;
  onChange?: (
    dates: [Dayjs | null, Dayjs | null] | null,
    meta: RangeDatePickerChangeMeta,
  ) => void;
  placeholder?: [string, string];
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  format?: string;
};

export function ResponsiveRangeDatePicker({
  startDate,
  endDate,
  onChange,
  placeholder,
  disabled,
  style,
  className,
  format = 'YYYY-MM',
}: RangeProps) {
  const mobile = useMobileEdit();
  const t = useTranslations('Edit.datePicker');
  const endIsPresent = isResumePresentEndDate(endDate);
  const start = toDayjsValue(startDate);
  const end = endIsPresent ? undefined : toDayjsValue(endDate);
  const presentLabel = t('presentEnd');
  const placeholders = useMemo(
    (): [string, string] => [
      placeholder?.[0] ?? '',
      endIsPresent ? presentLabel : (placeholder?.[1] ?? ''),
    ],
    [endIsPresent, placeholder, presentLabel],
  );

  if (!mobile) {
    return (
      <DesktopRangeDatePicker
        start={start}
        end={end}
        endIsPresent={endIsPresent}
        presentLabel={presentLabel}
        placeholders={placeholders}
        disabled={disabled}
        style={style}
        className={className}
        format={format}
        onChange={onChange}
      />
    );
  }
  return (
    <MobileRangeDatePicker
      value={[start, end]}
      endIsPresent={endIsPresent}
      presentLabel={presentLabel}
      placeholder={placeholders}
      disabled={disabled}
      style={style}
      format={format}
      title={placeholder?.[0]}
      onChange={onChange}
    />
  );
}

function DesktopRangeDatePicker({
  start,
  end,
  endIsPresent,
  presentLabel,
  placeholders,
  disabled,
  style,
  className,
  format,
  onChange,
}: {
  start?: Dayjs;
  end?: Dayjs;
  endIsPresent: boolean;
  presentLabel: string;
  placeholders: [string, string];
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  format: string;
  onChange?: RangeProps['onChange'];
}) {
  const [open, setOpen] = useState(false);
  const rangeDraftRef = useRef<[Dayjs | null, Dayjs | null]>([start ?? null, end ?? null]);
  const pickerValue: [Dayjs | null, Dayjs | null] | null =
    start || end || endIsPresent ? [start ?? null, endIsPresent ? null : (end ?? null)] : null;

  useEffect(() => {
    rangeDraftRef.current = [start ?? null, endIsPresent ? null : (end ?? null)];
  }, [start, end, endIsPresent]);

  const syncRangeDraft = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates) rangeDraftRef.current = dates;
  };

  const toRangeTuple = (
    dates: [Dayjs | null, Dayjs | null] | null,
  ): [Dayjs | null, Dayjs | null] | null =>
    dates ? [dates[0] ?? null, dates[1] ?? null] : null;

  const pickPresentEnd = () => {
    const [draftStart] = rangeDraftRef.current;
    onChange?.([draftStart ?? start ?? null, null], { endIsPresent: true });
    setOpen(false);
  };

  return (
    <DatePicker.RangePicker
      picker='month'
      open={open}
      onOpenChange={setOpen}
      allowEmpty={[true, true]}
      style={{ width: '100%', ...style }}
      className={className}
      value={pickerValue}
      placeholder={placeholders}
      disabled={disabled}
      format={format}
      onCalendarChange={(dates) => {
        syncRangeDraft(toRangeTuple(dates));
      }}
      onChange={(dates) => {
        const next = toRangeTuple(dates);
        syncRangeDraft(next);
        onChange?.(next, { endIsPresent: false });
      }}
      renderExtraFooter={() => (
        <div className='flex justify-center border-t border-fg/[0.08] bg-[linear-gradient(180deg,transparent,rgb(var(--panel-surface-rgb)/0.05))] px-3 py-2.5'>
          <PresentEndAction
            label={presentLabel}
            active={endIsPresent}
            onClick={pickPresentEnd}
          />
        </div>
      )}
    />
  );
}

export function toDayjsValue(v: unknown): Dayjs | undefined {
  if (v == null || v === '') return undefined;
  if (isResumePresentEndDate(String(v))) return undefined;
  if (dayjs.isDayjs(v)) return v as Dayjs;
  const d = dayjs(v as string);
  return d.isValid() ? d : undefined;
}
