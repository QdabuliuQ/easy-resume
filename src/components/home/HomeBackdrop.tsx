'use client';

import { memo } from 'react';

export default memo(function HomeBackdrop() {
  return (
    <div className='pointer-events-none fixed inset-0 z-0 overflow-hidden' aria-hidden>
      <div className='absolute inset-0 size-full bg-[radial-gradient(ellipse_at_50%_38%,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_72%)]' />
      <div className='absolute -left-[10%] top-[6%] h-[44%] w-[58%] rounded-[2rem] bg-[color-mix(in_srgb,var(--color-primary-gradient-start)_16%,transparent)] blur-3xl' />
      <div className='absolute -right-[6%] top-[34%] h-[36%] w-[46%] rounded-[1.75rem] bg-[color-mix(in_srgb,var(--color-primary)_13%,transparent)] blur-3xl' />
      <div className='absolute bottom-[8%] left-[4%] h-[30%] w-[40%] rounded-full bg-[color-mix(in_srgb,var(--color-primary)_9%,transparent)] blur-3xl' />
      <div className='absolute right-[8%] top-[12%] h-32 w-32 rotate-12 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary-gradient-start)_24%,transparent)]' />
      <div className='absolute left-[12%] top-[46%] h-24 w-40 -rotate-[8deg] rounded-xl bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]' />
      <div className='absolute right-[20%] top-[58%] h-20 w-20 rotate-[22deg] rounded-2xl border border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]' />
      <div className='absolute bottom-[18%] left-[28%] h-14 w-14 rounded-full bg-[color-mix(in_srgb,var(--color-primary-gradient-start)_20%,transparent)]' />
      <div className='absolute right-[12%] bottom-[10%] h-28 w-16 rotate-[14deg] rounded-3xl bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]' />
      <div className='absolute inset-x-[8%] top-[68%] h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] to-transparent' />
    </div>
  );
});
