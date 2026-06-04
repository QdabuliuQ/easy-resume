type GaugeRingProps = {
  gradId: string;
  score: number;
};

export default function GaugeRing({ gradId, score }: GaugeRingProps) {
  const r = 78;
  const cx = 110;
  const cy = 100;
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const dash = `${score} 100`;

  return (
    <svg viewBox='0 0 220 118' className='mx-auto block h-[118px] w-full max-w-[220px]' aria-hidden>
      <defs>
        <linearGradient id={gradId} x1='0%' y1='0%' x2='100%' y2='0%'>
          <stop offset='0%' stopColor='var(--color-primary-gradient-start)' />
          <stop offset='100%' stopColor='var(--color-primary)' />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill='none'
        stroke='var(--panel-chart-track)'
        strokeWidth='14'
        strokeLinecap='round'
        pathLength={100}
      />
      {score > 0 ? (
        <path
          d={d}
          fill='none'
          stroke={`url(#${gradId})`}
          strokeWidth='14'
          strokeLinecap='round'
          pathLength={100}
          strokeDasharray={dash}
        />
      ) : null}
    </svg>
  );
}
