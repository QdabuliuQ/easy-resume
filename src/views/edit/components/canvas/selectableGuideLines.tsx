type HoverRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

interface SelectableGuideLinesProps {
  hoverRect: HoverRect;
  viewport: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

const HORIZONTAL_GRADIENT = 'linear-gradient(90deg, rgba(20,184,166,0.92) 0%, rgba(45,212,191,0.98) 50%, rgba(6,182,212,0.92) 100%)';
const VERTICAL_GRADIENT = 'linear-gradient(180deg, rgba(6,182,212,0.92) 0%, rgba(45,212,191,0.98) 50%, rgba(20,184,166,0.92) 100%)';

export default function SelectableGuideLines({
  hoverRect,
  viewport,
}: SelectableGuideLinesProps) {
  return (
    <>
      <span
        aria-hidden='true'
        className='pointer-events-none absolute z-[15] h-[1px]'
        style={{
          left: `${viewport.left}px`,
          top: `${hoverRect.top}px`,
          width: `${viewport.width}px`,
          backgroundImage: HORIZONTAL_GRADIENT,
          boxShadow: '0 0 8px rgba(45, 212, 191, 0.45)',
          opacity: 0.95,
        }}
      />
      <span
        aria-hidden='true'
        className='pointer-events-none absolute z-[15] h-[1px]'
        style={{
          left: `${viewport.left}px`,
          top: `${hoverRect.top + hoverRect.height}px`,
          width: `${viewport.width}px`,
          backgroundImage: HORIZONTAL_GRADIENT,
          boxShadow: '0 0 8px rgba(45, 212, 191, 0.45)',
          opacity: 0.95,
        }}
      />
      <span
        aria-hidden='true'
        className='pointer-events-none absolute z-[15] w-[1px]'
        style={{
          left: `${hoverRect.left}px`,
          top: `${viewport.top}px`,
          height: `${viewport.height}px`,
          backgroundImage: VERTICAL_GRADIENT,
          boxShadow: '0 0 8px rgba(34, 211, 238, 0.45)',
          opacity: 0.95,
        }}
      />
      <span
        aria-hidden='true'
        className='pointer-events-none absolute z-[15] w-[1px]'
        style={{
          left: `${hoverRect.left + hoverRect.width}px`,
          top: `${viewport.top}px`,
          height: `${viewport.height}px`,
          backgroundImage: VERTICAL_GRADIENT,
          boxShadow: '0 0 8px rgba(34, 211, 238, 0.45)',
          opacity: 0.95,
        }}
      />
    </>
  );
}
