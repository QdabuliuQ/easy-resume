'use client';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef } from 'react';
import type { InterviewDifficulty } from '@/lib/ai/interview/types';

type DifficultySliderProps = {
  value: InterviewDifficulty;
  onChange: (v: InterviewDifficulty) => void;
};

export default function DifficultySlider({ value, onChange }: DifficultySliderProps) {
  const t = useTranslations('Edit.aiInterview');
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const levels = useMemo(
    () =>
      [
        { value: 'easy' as const, label: t('difficultyEasy'), hint: t('difficultyEasyHint') },
        { value: 'medium' as const, label: t('difficultyMedium'), hint: t('difficultyMediumHint') },
        { value: 'hard' as const, label: t('difficultyHard'), hint: t('difficultyHardHint') },
      ] as const,
    [t],
  );

  const indexOf = useCallback(
    (v: InterviewDifficulty) =>
      Math.max(
        0,
        levels.findIndex((l) => l.value === v),
      ),
    [levels],
  );

  const pickFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = rect.width || 1;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / width));
      const idx = Math.min(levels.length - 1, Math.max(0, Math.round(ratio * (levels.length - 1))));
      const next = levels[idx]!.value;
      if (next !== value) onChange(next);
    },
    [onChange, value, levels],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    const target = e.currentTarget;
    if (typeof target.setPointerCapture === 'function') {
      target.setPointerCapture(e.pointerId);
    }
    pickFromClientX(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    pickFromClientX(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    const target = e.currentTarget;
    if (typeof target.releasePointerCapture === 'function') {
      target.releasePointerCapture(e.pointerId);
    }
  };

  const idx = indexOf(value);
  const thumbPct = (idx / (levels.length - 1)) * 100;
  const current = levels[idx]!;

  return (
    <div className='space-y-3'>
      <div
        ref={trackRef}
        role='slider'
        aria-valuemin={0}
        aria-valuemax={levels.length - 1}
        aria-valuenow={idx}
        aria-valuetext={current.label}
        aria-label={t('difficultyAria')}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(levels[Math.max(0, idx - 1)]!.value);
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(levels[Math.min(levels.length - 1, idx + 1)]!.value);
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className='relative h-11 cursor-grab touch-none select-none rounded-xl bg-fg/[0.035] px-3 active:cursor-grabbing'
      >
        <div className='pointer-events-none absolute inset-x-3 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-fg/[0.08]' />
        <div
          className='pointer-events-none absolute left-3 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,var(--color-primary-gradient-start),var(--color-primary))] transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
          style={{ width: `calc((100% - 1.5rem) * ${thumbPct / 100})` }}
        />
        <div className='pointer-events-none absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between'>
          {levels.map((l) => (
            <span
              key={l.value}
              className={`size-2.5 rounded-full border transition-colors duration-200 ${
                indexOf(value) >= indexOf(l.value)
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                  : 'border-fg/20 bg-[var(--editor-shell-panel)]'
              }`}
            />
          ))}
        </div>
        <div
          className='pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-primary)] shadow-[0_6px_16px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] transition-[left] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
          style={{ left: `calc(0.75rem + (100% - 1.5rem) * ${thumbPct / 100})` }}
        />
      </div>
      <div className='flex justify-between px-0.5'>
        {levels.map((l) => {
          const on = l.value === value;
          return (
            <button
              key={l.value}
              type='button'
              onClick={() => onChange(l.value)}
              className={`text-[12px] font-semibold transition-colors duration-200 ${
                on ? 'text-[var(--color-primary)]' : 'text-fg/45 hover:text-fg/70'
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
      <p className='text-[11px] leading-relaxed text-fg/45'>{current.hint}</p>
    </div>
  );
}
