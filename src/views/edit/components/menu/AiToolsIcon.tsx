type AiToolsIconProps = {
  size?: number;
  className?: string;
};

/** Soft Depth：星芒 + 三角节点，暗示评分 / 帮写 / 面试三合一 */
export default function AiToolsIcon({ size = 20, className }: AiToolsIconProps) {
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
      <path
        d='M12 3.2 13.15 8.4 18.2 9.55 13.15 10.7 12 15.9 10.85 10.7 5.8 9.55 10.85 8.4 12 3.2Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <circle cx='6.2' cy='17.4' r='1.55' stroke='currentColor' strokeWidth='1.5' />
      <circle cx='17.8' cy='17.4' r='1.55' stroke='currentColor' strokeWidth='1.5' />
      <circle cx='12' cy='20.2' r='1.35' stroke='currentColor' strokeWidth='1.5' />
      <path
        d='M10.6 14.85 7.55 16.35M13.4 14.85 16.45 16.35M12 16.05v2.35'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
}
