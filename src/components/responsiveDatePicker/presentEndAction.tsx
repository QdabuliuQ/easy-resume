'use client';
import { memo } from 'react';

type PresentEndActionProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  fullWidth?: boolean;
  className?: string;
};

function PresentEndAction({
  label,
  active,
  onClick,
  className = '',
}: PresentEndActionProps) {
  return (
    <button
      type='button'
      aria-pressed={active}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full border px-4 py-1.2 text-[13px] font-medium outline-none transition-[transform,border-color,background-color,color,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-1 active:scale-[0.98] w-full ${
        active
          ? 'border-[color:color-mix(in_srgb,var(--color-primary)_44%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_16%,transparent)] text-[color:var(--color-primary)] shadow-[0_6px_16px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]'
          : 'border-fg/[0.12] bg-surface/[0.06] text-fg/74 hover:border-[color:color-mix(in_srgb,var(--color-primary)_30%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)] hover:text-fg/92'
      } ${className}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default memo(PresentEndAction);
