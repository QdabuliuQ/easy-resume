export function clampScore0to100(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function scoreMeta(score: number, ta: (key: string) => string) {
  if (score >= 90) {
    return {
      label: ta('bandStrong'),
      tone: 'text-emerald-300',
      chip: 'bg-emerald-400/14 text-emerald-300 border-emerald-300/20',
    };
  }
  if (score >= 75) {
    return {
      label: ta('bandSolid'),
      tone: 'text-amber-200',
      chip: 'bg-amber-300/14 text-amber-200 border-amber-200/20',
    };
  }
  return {
    label: ta('bandWeak'),
    tone: 'text-rose-400',
    chip: 'bg-rose-300/14 text-rose-400 border-rose-200/20',
  };
}
