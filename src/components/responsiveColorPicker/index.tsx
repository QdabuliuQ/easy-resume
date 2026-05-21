'use client';
import { useDebounceFn } from 'ahooks';
import { Popover } from 'antd';
import { useRef, useState } from 'react';
import ResumeColorPanel from '@/components/colorPickerPanel';
import MobileColorPicker from '@/components/mobileColorPicker';
import { hexForColorInput } from '@/lib/resumeColorHex';
import { useMobileEdit } from '@/views/edit/mobile/context';
export type ResponsiveColorPickerProps = {
  value: string;
  onChange: (v: string) => void;
  presets: readonly string[];
  fallback?: string;
  ariaLabel: string;
  presetLabel: string;
  title?: string;
  debounceMs?: number;
  disabled?: boolean;
};
function DesktopColorPicker({
  value,
  onChange,
  presets,
  fallback = '#1890ff',
  ariaLabel,
  presetLabel,
  debounceMs = 280,
  disabled,
}: ResponsiveColorPickerProps) {
  const resolved = hexForColorInput(value, fallback);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(resolved);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const debounced = useDebounceFn((v: string) => onChange(v), { wait: debounceMs });
  const swatch = hexForColorInput(open ? draft : value, resolved);
  return (
    <Popover
      trigger='click'
      placement='left'
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (next) {
          const init = hexForColorInput(value, fallback);
          setDraft(init);
          draftRef.current = init;
        } else {
          debounced.cancel();
          const commit = hexForColorInput(draftRef.current, fallback);
          if (commit !== resolved) onChange(commit);
        }
      }}
      content={
        <ResumeColorPanel
          value={draft}
          fallback={fallback}
          presets={presets}
          presetLabel={presetLabel}
          onChange={(v) => {
            setDraft(v);
            debounced.run(v);
          }}
        />
      }
    >
      <button
        type='button'
        disabled={disabled}
        aria-label={ariaLabel}
        className='size-[30px] shrink-0 cursor-pointer rounded-md border border-fg/[0.12] shadow-inner disabled:opacity-50'
        style={{ backgroundColor: swatch }}
      />
    </Popover>
  );
}
export default function ResponsiveColorPicker(props: ResponsiveColorPickerProps) {
  const mobile = useMobileEdit();
  const fb = props.fallback ?? '#1890ff';
  if (mobile) {
    return (
      <MobileColorPicker
        value={props.value}
        onChange={props.onChange}
        presets={props.presets}
        fallback={fb}
        ariaLabel={props.ariaLabel}
        title={props.title ?? props.ariaLabel}
        presetLabel={props.presetLabel}
        debounceMs={props.debounceMs}
        disabled={props.disabled}
      />
    );
  }
  return <DesktopColorPicker {...props} fallback={fb} />;
}
