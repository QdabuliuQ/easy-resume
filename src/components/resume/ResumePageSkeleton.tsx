'use client';

const SK = '#d4d4d8';
const SK_LIGHT = '#e4e4e7';
const SK_DARK = '#a1a1aa';

function Section({
  y,
  titleW = 120,
  lines = 4,
}: {
  y: number;
  titleW?: number;
  lines?: number;
}) {
  return (
    <g>
      <rect x='36' y={y} width={titleW} height='14' rx='3' fill={SK_DARK} />
      <rect x='36' y={y + 22} width='523' height='2' fill={SK_LIGHT} />
      {Array.from({ length: lines }, (_, i) => (
        <rect
          key={i}
          x='36'
          y={y + 34 + i * 16}
          width={523 - (i % 3) * 48}
          height='8'
          rx='2'
          fill={SK}
        />
      ))}
    </g>
  );
}

/** A4 简历结构骨架；白底固定，仅灰条呼吸 */
export default function ResumePageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`h-full w-full overflow-hidden bg-white ${className}`} aria-hidden>
      <svg viewBox='0 0 595 842' className='h-full w-full' preserveAspectRatio='xMidYMin slice'>
        <rect width='595' height='842' fill='#fff' />
        <g className='resume-skeleton-breathe motion-reduce:animate-none'>
          <circle cx='72' cy='78' r='34' fill={SK} />
          <rect x='130' y='52' width='220' height='18' rx='4' fill={SK_DARK} />
          <rect x='130' y='78' width='160' height='10' rx='2' fill={SK} />
          <rect x='130' y='96' width='280' height='8' rx='2' fill={SK_LIGHT} />
          <rect x='130' y='112' width='240' height='8' rx='2' fill={SK_LIGHT} />
          <rect x='36' y='138' width='523' height='2' fill={SK_LIGHT} />
          <Section y={156} titleW={88} lines={3} />
          <Section y={248} titleW={104} lines={4} />
          <Section y={352} titleW={96} lines={3} />
          <Section y={444} titleW={112} lines={4} />
          <Section y={548} titleW={80} lines={2} />
        </g>
      </svg>
    </div>
  );
}
