import type { CSSProperties } from 'react';

export const mobilePickerTriggerClass =
  'mobile-picker-trigger flex h-8 w-full min-w-0 items-center rounded-lg border-0 px-3 text-left text-sm disabled:opacity-50';

export const mobilePickerSheetBodyStyle: CSSProperties = {
  borderTopLeftRadius: 8,
  borderTopRightRadius: 8,
  background: 'var(--mobile-picker-popup-bg)',
  color: 'var(--text-strong)',
};
