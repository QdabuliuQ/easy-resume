export const ICON_PRIMARY = 'var(--color-primary)';
export const ICON_MUTED = 'rgb(var(--surface-fg-rgb) / 0.55)';

export const actionBtnCls = [
  'inline-flex min-h-9 cursor-pointer select-none items-center justify-center gap-1 rounded-xl px-3 py-2',
  'border border-[color-mix(in_srgb,var(--color-primary)_32%,transparent)]',
  'bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--editor-shell-panel-strong))]',
  'text-[12px] font-medium leading-snug text-[color:var(--color-primary)] whitespace-nowrap',
  'transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out',
  'hover:border-[color-mix(in_srgb,var(--color-primary)_42%,transparent)]',
  'hover:bg-[color-mix(in_srgb,var(--color-primary)_16%,var(--editor-shell-panel-strong))]',
  'active:scale-[0.98]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--color-primary)_42%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--editor-shell-panel)]',
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
  'motion-reduce:transition-none motion-reduce:active:scale-100',
].join(' ');

export const actionIconSpin =
  'inline-block size-4 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--color-primary-gradient-start)_35%,transparent)] border-t-[var(--color-primary)]';

export const arrowCls = (open: boolean) =>
  `text-[10px] opacity-80 transition-transform duration-200 ${open ? 'rotate-180' : ''}`;
