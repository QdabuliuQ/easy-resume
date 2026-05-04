import { Add } from '@icon-park/react';
import { memo, type ReactNode } from 'react';

const btnClass =
  'bg-gradient-primary mb-5 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border-0 text-[14px] font-bold text-[#fff] outline-none transition-[filter] duration-200 hover:brightness-110 active:brightness-95';

const iconWrapClass =
  'inline-flex shrink-0 items-center justify-center leading-1 [&_svg]:block';

function AddGradientButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button type='button' className={btnClass} onClick={onClick}>
      <span className={iconWrapClass}>
        <Add theme='outline' size='17' fill='#fff' />
      </span>
      {children}
    </button>
  );
}

export default memo(AddGradientButton);
