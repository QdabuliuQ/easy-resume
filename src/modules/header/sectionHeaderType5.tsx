'use client';

export function SectionHeaderType5({
  title,
  color,
  fontSizeCss,
}: {
  title: string;
  color: string;
  fontSizeCss: string;
}) {
  return (
    <div className='relative w-full flex items-stretch  '>
      <div
        className='pointer-events-none absolute inset-y-0 left-0 z-0 w-full opacity-20'
        style={{
          backgroundColor: color,
          clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)',
        }}
        aria-hidden
      />
      <div
        className='relative z-[1] flex shrink-0 items-center pl-5 pr-8 py-[4px] font-bold text-white'
        style={{
          backgroundColor: color,
          clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)',
          fontSize: fontSizeCss,
        }}
      >
        {title}
      </div>
    </div>
  );
}
