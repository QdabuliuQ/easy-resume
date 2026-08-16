'use client';
import { useId } from 'react';

type AiToolsIconProps = {
  size?: number;
  className?: string;
  /** 紫→青渐变描边/填充，对齐润色按钮 */
  gradient?: boolean;
};

/** 机器人头：天线 + 面罩 + 双眼，科技感 AI */
export default function AiToolsIcon({ size = 24, className, gradient }: AiToolsIconProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `ai-tools-grad-${uid}`;
  const paint = gradient ? `url(#${gradId})` : 'currentColor';

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      aria-hidden
    >
      {gradient ? (
        <defs>
          <linearGradient id={gradId} x1='3' y1='2' x2='21' y2='22' gradientUnits='userSpaceOnUse'>
            <stop stopColor='var(--ai-polish-from, #7b66ff)' />
            <stop offset='1' stopColor='var(--ai-polish-to, #5cd7ff)' />
          </linearGradient>
        </defs>
      ) : null}
      {/* 天线 */}
      <path
        d='M12 4.2V6.5'
        stroke={paint}
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <circle cx='12' cy='3.2' r='1.15' fill={paint} />
      {/* 头壳 */}
      <rect
        x='4.5'
        y='6.5'
        width='15'
        height='13'
        rx='4'
        stroke={paint}
        strokeWidth='1.5'
      />
      {/* 侧耳 */}
      <path
        d='M4.5 11.2H3.4c-.5 0-.9.4-.9.9v1.8c0 .5.4.9.9.9h1.1M19.5 11.2h1.1c.5 0 .9.4.9.9v1.8c0 .5-.4.9-.9.9h-1.1'
        stroke={paint}
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      {/* 双眼 */}
      <circle cx='9.1' cy='12.4' r='1.55' fill={paint} />
      <circle cx='14.9' cy='12.4' r='1.55' fill={paint} />
      {/* 嘴部指示条 */}
      <path
        d='M9.2 16.6h5.6'
        stroke={paint}
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
}
