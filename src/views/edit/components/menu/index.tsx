import { ProfileOutlined } from '@ant-design/icons';
import { Magic } from '@icon-park/react';

const GRADIENT_ID = 'resume-menu-item-grad';

const menuItems = [
  { label: '简历编辑', key: 'resume' as const },
  { label: 'AI 智能评分', key: 'ai-score' as const },
];

type MenuProps = {
  activeKey: string;
  onActiveKeyChange: (key: string) => void;
};

export default function Menu({ activeKey, onActiveKeyChange }: MenuProps) {
  return (
    <div className='relative flex h-full w-[100px] shrink-0 flex-col bg-[#444145]'>
      <svg width={0} height={0} className='absolute' aria-hidden>
        <defs>
          <linearGradient id={GRADIENT_ID} x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='var(--color-primary-gradient-start)' />
            <stop offset='100%' stopColor='var(--color-primary)' />
          </linearGradient>
        </defs>
      </svg>
      {menuItems.map((item) => {
        const selected = activeKey === item.key;
        return (
          <div
            key={item.key}
            role='button'
            tabIndex={0}
            onClick={() => onActiveKeyChange(item.key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActiveKeyChange(item.key);
              }
            }}
            className={`flex w-full cursor-pointer select-none flex-col items-center justify-center gap-0.5 rounded-bl-[10px] rounded-tl-[10px] py-[10px] text-[13px] transition-colors ${
              selected
                ? 'bg-[#38363a]'
                : 'bg-transparent hover:bg-white/5'
            }`}
          >
            {item.key === 'resume' ? (
              <ProfileOutlined
                className={
                  selected
                    ? 'text-[23px] transition-[fill] duration-200 [&_svg]:!fill-[url(#resume-menu-item-grad)]'
                    : 'text-[23px] transition-[fill] duration-200 [&_svg]:!fill-[#8c8c8c]'
                }
              />
            ) : (
              <Magic
                theme='outline'
                size='23'
                fill={selected ? `url(#${GRADIENT_ID})` : '#8c8c8c'}
                className='transition-[fill] duration-200'
              />
            )}
            <span
              className={
                selected
                  ? 'bg-gradient-primary mt-[5px] bg-clip-text text-[12px] text-transparent transition-colors duration-200'
                  : 'mt-[5px] text-[12px] text-[#8c8c8c] transition-colors duration-200'
              }
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
