import { useEffect, useState } from 'react';

type HoverRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

interface SelectableGuideLinesProps {
  hoverRect: HoverRect | null;
  visible: boolean;
  viewport: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

const HORIZONTAL_GRADIENT = 'linear-gradient(90deg, rgba(20,184,166,0.92) 0%, rgba(45,212,191,0.98) 50%, rgba(6,182,212,0.92) 100%)';
const VERTICAL_GRADIENT = 'linear-gradient(180deg, rgba(6,182,212,0.92) 0%, rgba(45,212,191,0.98) 50%, rgba(20,184,166,0.92) 100%)';
const GUIDE_LINE_TRANSITION =
  'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), width 280ms cubic-bezier(0.22, 1, 0.36, 1), height 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out';

export default function SelectableGuideLines({
  hoverRect,
  visible,
  viewport,
}: SelectableGuideLinesProps) {
  const [displayRect, setDisplayRect] = useState<HoverRect | null>(hoverRect);

  useEffect(() => {
    if (hoverRect) setDisplayRect(hoverRect);
  }, [hoverRect]);

  if (!displayRect) return null;

  return (
    <>
      <span
        aria-hidden='true'
        className='pointer-events-none absolute z-[15] h-[1px]'
        style={{
          left: 0,
          top: 0,
          width: `${viewport.width}px`,
          transform: `translate3d(${viewport.left}px, ${displayRect.top}px, 0)`,
          backgroundImage: HORIZONTAL_GRADIENT,
          boxShadow: '0 0 8px rgba(45, 212, 191, 0.45)',
          opacity: visible ? 0.95 : 0,
          transition: GUIDE_LINE_TRANSITION,
          willChange: 'transform, width, opacity',
        }}
      />
      <span
        aria-hidden='true'
        className='pointer-events-none absolute z-[15] h-[1px]'
        style={{
          left: 0,
          top: 0,
          width: `${viewport.width}px`,
          transform: `translate3d(${viewport.left}px, ${displayRect.top + displayRect.height}px, 0)`,
          backgroundImage: HORIZONTAL_GRADIENT,
          boxShadow: '0 0 8px rgba(45, 212, 191, 0.45)',
          opacity: visible ? 0.95 : 0,
          transition: GUIDE_LINE_TRANSITION,
          willChange: 'transform, width, opacity',
        }}
      />
      <span
        aria-hidden='true'
        className='pointer-events-none absolute z-[15] w-[1px]'
        style={{
          left: 0,
          top: 0,
          height: `${viewport.height}px`,
          transform: `translate3d(${displayRect.left}px, ${viewport.top}px, 0)`,
          backgroundImage: VERTICAL_GRADIENT,
          boxShadow: '0 0 8px rgba(34, 211, 238, 0.45)',
          opacity: visible ? 0.95 : 0,
          transition: GUIDE_LINE_TRANSITION,
          willChange: 'transform, height, opacity',
        }}
      />
      <span
        aria-hidden='true'
        className='pointer-events-none absolute z-[15] w-[1px]'
        style={{
          left: 0,
          top: 0,
          height: `${viewport.height}px`,
          transform: `translate3d(${displayRect.left + displayRect.width}px, ${viewport.top}px, 0)`,
          backgroundImage: VERTICAL_GRADIENT,
          boxShadow: '0 0 8px rgba(34, 211, 238, 0.45)',
          opacity: visible ? 0.95 : 0,
          transition: GUIDE_LINE_TRANSITION,
          willChange: 'transform, height, opacity',
        }}
      />
    </>
  );
}
