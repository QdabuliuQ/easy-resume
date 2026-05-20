'use client';
import { DatePicker, Popup } from 'antd-mobile';
import type { Precision } from 'antd-mobile/es/components/date-picker/date-picker-utils';
import dayjs, { type Dayjs } from 'dayjs';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import {
  mobilePickerSheetBodyStyle,
  mobilePickerTriggerClass,
} from '@/components/mobilePicker/shared';

function toDayjs(v: unknown): Dayjs | null {
  if (v == null || v === '') return null;
  if (dayjs.isDayjs(v)) return v as Dayjs;
  const d = dayjs(v as string);
  return d.isValid() ? d : null;
}

function antdPickerToPrecision(picker?: string): Precision {
  if (picker === 'year') return 'year';
  if (picker === 'month') return 'month';
  return 'day';
}

type MobileDatePickerProps = {
  value?: Dayjs | null;
  defaultValue?: Dayjs | string | null;
  onChange?: (date: Dayjs | null, dateString: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  picker?: 'date' | 'month' | 'year';
  format?: string;
};

export function MobileDatePicker({
  value,
  defaultValue,
  onChange,
  placeholder = '请选择',
  disabled,
  className,
  style,
  title,
  picker,
  format,
}: MobileDatePickerProps) {
  const precision = antdPickerToPrecision(picker);
  const fmt = format ?? (precision === 'month' ? 'YYYY-MM' : precision === 'year' ? 'YYYY' : 'YYYY-MM-DD');
  const controlled = value !== undefined;
  const [visible, setVisible] = useState(false);
  const [inner, setInner] = useState<Dayjs | null>(() => toDayjs(value ?? defaultValue));

  useEffect(() => {
    if (!controlled) return;
    setInner(toDayjs(value));
  }, [controlled, value]);

  const display = useMemo(() => {
    const d = controlled ? toDayjs(value) : inner;
    if (!d) return placeholder;
    return d.format(fmt);
  }, [controlled, fmt, inner, placeholder, value]);

  const pickerValue = (controlled ? toDayjs(value) : inner)?.toDate() ?? null;

  return (
    <>
      <button
        type='button'
        disabled={disabled}
        onClick={() => !disabled && setVisible(true)}
        className={`${mobilePickerTriggerClass} ${className ?? ''}`}
        style={style}
      >
        <span
          className={`min-w-0 flex-1 truncate ${display === placeholder ? 'mobile-picker-placeholder' : ''}`}
        >
          {display}
        </span>
      </button>
      <DatePicker
        visible={visible}
        precision={precision}
        value={pickerValue}
        title={title ?? placeholder}
        onClose={() => setVisible(false)}
        onConfirm={(v) => {
          const next = dayjs(v);
          if (!controlled) setInner(next);
          onChange?.(next, next.format(fmt));
          setVisible(false);
        }}
      />
    </>
  );
}

type MobileRangeDatePickerProps = {
  value?: [Dayjs | undefined, Dayjs | undefined];
  onChange?: (dates: [Dayjs, Dayjs] | null) => void;
  placeholder?: [string, string];
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  format?: string;
};

export function MobileRangeDatePicker({
  value,
  onChange,
  placeholder = ['开始', '结束'],
  disabled,
  className,
  style,
  title,
  format = 'YYYY-MM',
}: MobileRangeDatePickerProps) {
  const t = useTranslations('Edit.moduleManage');
  const tm = useTranslations('Edit.mobile');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pick, setPick] = useState<'start' | 'end' | null>(null);
  const start = value?.[0];
  const end = value?.[1];
  const [draftStart, setDraftStart] = useState<Dayjs>(() => start ?? dayjs());
  const [draftEnd, setDraftEnd] = useState<Dayjs>(() => end ?? dayjs());

  useEffect(() => {
    if (start) setDraftStart(start);
    if (end) setDraftEnd(end);
  }, [start, end]);

  const display = useMemo(() => {
    if (start && end) return `${start.format(format)} ~ ${end.format(format)}`;
    if (start) return `${start.format(format)} ~ ${placeholder[1]}`;
    if (end) return `${placeholder[0]} ~ ${end.format(format)}`;
    return `${placeholder[0]} ~ ${placeholder[1]}`;
  }, [end, format, placeholder, start]);

  const empty = display === `${placeholder[0]} ~ ${placeholder[1]}`;

  const commit = () => {
    onChange?.([draftStart, draftEnd]);
    setSheetOpen(false);
  };

  return (
    <>
      <button
        type='button'
        disabled={disabled}
        onClick={() => !disabled && setSheetOpen(true)}
        className={`${mobilePickerTriggerClass} ${className ?? ''}`}
        style={style}
      >
        <span
          className={`min-w-0 flex-1 truncate ${empty ? 'mobile-picker-placeholder' : ''}`}
        >
          {display}
        </span>
      </button>
      <Popup
        visible={sheetOpen}
        onMaskClick={() => setSheetOpen(false)}
        bodyClassName='mobile-picker-sheet'
        bodyStyle={mobilePickerSheetBodyStyle}
      >
        <div className='border-b border-[color:var(--adm-color-border)] px-4 py-3 text-center text-sm font-semibold text-[color:var(--adm-color-text)]'>
          {title ?? placeholder[0]}
        </div>
        <button
          type='button'
          className='flex w-full items-center justify-between border-b border-[color:var(--adm-color-border)] px-4 py-3 text-left text-sm text-[color:var(--adm-color-text)]'
          onClick={() => setPick('start')}
        >
          <span className='text-[color:var(--adm-color-text-secondary)]'>{tm('periodStart')}</span>
          <span>{draftStart.format(format)}</span>
        </button>
        <button
          type='button'
          className='flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[color:var(--adm-color-text)]'
          onClick={() => setPick('end')}
        >
          <span className='text-[color:var(--adm-color-text-secondary)]'>{tm('periodEnd')}</span>
          <span>{draftEnd.format(format)}</span>
        </button>
        <div className='flex gap-3 border-t border-[color:var(--adm-color-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'>
          <button
            type='button'
            className='h-11 flex-1 rounded-xl border border-[color:var(--mobile-picker-trigger-border)] text-sm text-[color:var(--adm-color-text-secondary)]'
            onClick={() => setSheetOpen(false)}
          >
            {t('cancel')}
          </button>
          <button
            type='button'
            className='h-11 flex-1 rounded-xl bg-gradient-to-r from-[var(--color-primary-gradient-start)] to-[var(--color-primary)] text-sm font-semibold text-white'
            onClick={commit}
          >
            {t('confirm')}
          </button>
        </div>
      </Popup>
      <DatePicker
        visible={pick === 'start'}
        precision='month'
        value={draftStart.toDate()}
        title={tm('periodStart')}
        onClose={() => setPick(null)}
        onConfirm={(v) => {
          setDraftStart(dayjs(v));
          setPick(null);
        }}
      />
      <DatePicker
        visible={pick === 'end'}
        precision='month'
        value={draftEnd.toDate()}
        title={tm('periodEnd')}
        onClose={() => setPick(null)}
        onConfirm={(v) => {
          setDraftEnd(dayjs(v));
          setPick(null);
        }}
      />
    </>
  );
}
