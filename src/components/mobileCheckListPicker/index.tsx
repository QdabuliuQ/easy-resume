'use client';

import { CheckList, Popup } from 'antd-mobile';
import { useEffect, useMemo, useState } from 'react';
import {
  mobilePickerSheetBodyStyle,
  mobilePickerTriggerClass,
} from '@/components/mobilePicker/shared';

export type MobileSelectOption = {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
};

type SingleValue = string | number | undefined;
type MultiValue = (string | number)[];

type MobileCheckListPickerProps = {
  value?: SingleValue | MultiValue;
  defaultValue?: SingleValue | MultiValue;
  onChange?: (value: SingleValue | MultiValue) => void;
  options?: MobileSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
};

function normSingle(v: SingleValue | MultiValue | undefined): SingleValue {
  if (Array.isArray(v)) return v[0];
  return v;
}

function normMulti(v: SingleValue | MultiValue | undefined): MultiValue {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export default function MobileCheckListPicker({
  value,
  defaultValue,
  onChange,
  options = [],
  placeholder = '请选择',
  disabled,
  multiple,
  className,
  style,
  title,
}: MobileCheckListPickerProps) {
  const [visible, setVisible] = useState(false);
  const controlled = value !== undefined;
  const [inner, setInner] = useState<SingleValue | MultiValue>(() =>
    multiple ? normMulti(value ?? defaultValue) : normSingle(value ?? defaultValue),
  );

  useEffect(() => {
    if (!controlled) return;
    setInner(multiple ? normMulti(value) : normSingle(value));
  }, [controlled, multiple, value]);

  const display = useMemo(() => {
    if (multiple) {
      const vals = normMulti(controlled ? value : inner);
      if (!vals.length) return placeholder;
      const labels = vals
        .map((v) => options.find((o) => o.value === v)?.label ?? String(v))
        .filter(Boolean);
      return labels.join('、');
    }
    const v = normSingle(controlled ? value : inner);
    if (v == null || v === '') return placeholder;
    return options.find((o) => o.value === v)?.label ?? String(v);
  }, [controlled, inner, multiple, options, placeholder, value]);

  const listValue = multiple
    ? normMulti(controlled ? value : inner).map(String)
    : normSingle(controlled ? value : inner) != null
      ? [String(normSingle(controlled ? value : inner))]
      : [];

  const commit = (next: SingleValue | MultiValue) => {
    if (!controlled) setInner(next);
    onChange?.(next);
  };

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
      <Popup
        visible={visible}
        onMaskClick={() => setVisible(false)}
        bodyClassName='mobile-picker-sheet'
        bodyStyle={{
          ...mobilePickerSheetBodyStyle,
          minHeight: '40vh',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className='shrink-0 border-b border-[color:var(--adm-color-border)] px-4 py-3 text-center text-sm font-semibold text-[color:var(--adm-color-text)]'>
          {title ?? placeholder}
        </div>
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <CheckList
            value={listValue}
            multiple={multiple}
            onChange={(val) => {
              const arr = Array.isArray(val) ? val : [val];
              if (multiple) {
                const next = arr.map((s) => {
                  const hit = options.find((o) => String(o.value) === String(s));
                  return hit?.value ?? s;
                });
                setInner(next);
                return;
              }
              const raw = arr[0];
              const hit = options.find((o) => String(o.value) === String(raw));
              const next = hit?.value ?? raw;
              commit(next);
              setVisible(false);
            }}
          >
            {options.map((opt) => (
              <CheckList.Item
                key={String(opt.value)}
                value={String(opt.value)}
                disabled={opt.disabled}
              >
                {opt.label}
              </CheckList.Item>
            ))}
          </CheckList>
        </div>
        {multiple ? (
          <div className='shrink-0 border-t border-[color:var(--adm-color-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'>
            <button
              type='button'
              className='h-11 w-full rounded-xl bg-gradient-to-r from-[var(--color-primary-gradient-start)] to-[var(--color-primary)] text-sm font-semibold text-white'
              onClick={() => {
                commit(inner);
                setVisible(false);
              }}
            >
              确定
            </button>
          </div>
        ) : null}
      </Popup>
    </>
  );
}
