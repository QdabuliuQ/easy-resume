'use client';
import { Popup } from 'antd-mobile';
import { useEffect, useRef, useState } from 'react';
import ResumeColorPanel from '@/components/colorPickerPanel';
import { mobilePickerSheetBodyStyle } from '@/components/mobilePicker/shared';
import { hexForColorInput } from '@/lib/resumeColorHex';
type MobileColorPickerProps = {
  value: string;
  onChange: (v: string) => void;
  presets: readonly string[];
  fallback: string;
  ariaLabel: string;
  title: string;
  presetLabel: string;
  debounceMs?: number;
  disabled?: boolean;
};
export default function MobileColorPicker({
  value,
  onChange,
  presets,
  fallback,
  ariaLabel,
  title,
  presetLabel,
  debounceMs = 280,
  disabled,
}: MobileColorPickerProps) {
  const resolved = hexForColorInput(value, fallback);
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(resolved);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelDebounce = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };
  const scheduleChange = (v: string) => {
    cancelDebounce();
    debounceRef.current = setTimeout(() => onChange(hexForColorInput(v, fallback)), debounceMs);
  };
  useEffect(() => () => cancelDebounce(), []);
  const swatch = hexForColorInput(visible ? draft : value, resolved);
  const presetSet = new Set(presets.map((c) => hexForColorInput(c, '')));
  const open = () => {
    if (disabled) return;
    const next = hexForColorInput(value, fallback);
    setDraft(next);
    draftRef.current = next;
    setVisible(true);
  };
  const close = () => {
    setVisible(false);
    cancelDebounce();
    const next = hexForColorInput(draftRef.current, fallback);
    if (next !== resolved) onChange(next);
  };
  const handlePanelChange = (v: string) => {
    const next = hexForColorInput(v, fallback);
    setDraft(next);
    draftRef.current = next;
    if (presetSet.has(next)) {
      cancelDebounce();
      onChange(next);
      setVisible(false);
      return;
    }
    scheduleChange(next);
  };
  return (
    <>
      <button
        type='button'
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={open}
        className='size-[30px] shrink-0 cursor-pointer rounded-md border border-fg/[0.12] shadow-inner disabled:opacity-50'
        style={{ backgroundColor: swatch }}
      />
      <Popup
        visible={visible}
        onMaskClick={close}
        bodyClassName='mobile-picker-sheet'
        bodyStyle={{
          ...mobilePickerSheetBodyStyle,
          minHeight: 'auto',
          maxHeight: '70vh',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className='shrink-0 border-b border-[color:var(--adm-color-border)] px-4 py-3 text-center text-sm font-semibold text-[color:var(--adm-color-text)]'>
          {title}
        </div>
        <div className='px-4 py-3'>
          <ResumeColorPanel
            value={draft}
            fallback={fallback}
            presets={presets}
            presetLabel={presetLabel}
            onChange={handlePanelChange}
          />
        </div>
      </Popup>
    </>
  );
}
