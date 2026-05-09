import { AppstoreOutlined, ProfileOutlined } from '@ant-design/icons';
import { Magic } from '@icon-park/react';

const GRADIENT_ID = 'resume-menu-item-grad';

const menuItems = [
  { label: '简历模板', key: 'resume-template' as const },
  { label: '简历编辑', key: 'resume' as const },
  { label: 'AI 智能评分', key: 'ai-score' as const },
];

type MenuProps = {
  activeKey: string;
  onActiveKeyChange: (key: string) => void;
};

export default function Menu({ activeKey, onActiveKeyChange }: MenuProps) {
  return (
    <div className='relative flex h-full min-h-0 w-[108px] shrink-0 flex-col gap-[10px] bg-transparent px-[10px] py-[10px]'>
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
            className={`editor-shell-inset relative flex w-full cursor-pointer select-none flex-col items-center justify-center gap-1 overflow-hidden rounded-[18px] py-3 text-[13px] transition-all duration-200 ${
              selected
                ? 'scale-110 border-transparent bg-white/[0.08] shadow-[0_12px_30px_rgba(0,0,0,0.24)]'
                : 'border-transparent bg-transparent hover:border-white/8 hover:bg-white/[0.04]'
            }`}
          >
            {selected ? (
              <span
                aria-hidden
                className='pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-primary p-px'
              >
                <span className='block h-full w-full rounded-[17px] bg-[rgb(56,54,58)]/90' />
              </span>
            ) : null}
            {selected ? (
              <span
                aria-hidden
                className='bg-gradient-primary absolute inset-x-2 top-0 z-[2] h-px opacity-80'
              />
            ) : null}
            {item.key === 'resume' ? (
              <ProfileOutlined
                className={
                  selected
                    ? 'relative z-[1] text-[23px] transition-[fill] duration-200 [&_svg]:!fill-[url(#resume-menu-item-grad)]'
                    : 'relative z-[1] text-[23px] transition-[fill] duration-200 [&_svg]:!fill-[#97929f]'
                }
              />
            ) : item.key === 'resume-template' ? (
              <AppstoreOutlined
                className={
                  selected
                    ? 'relative z-[1] text-[23px] transition-[fill] duration-200 [&_svg]:!fill-[url(#resume-menu-item-grad)]'
                    : 'relative z-[1] text-[23px] transition-[fill] duration-200 [&_svg]:!fill-[#97929f]'
                }
              />
            ) : (
              <Magic
                theme='outline'
                size='23'
                fill={selected ? `url(#${GRADIENT_ID})` : '#97929f'}
                className='relative z-[1] transition-[fill] duration-200'
              />
            )}
            <span
              className={
                selected
                  ? 'bg-gradient-primary relative z-[1] mt-1 bg-clip-text text-[12px] font-medium text-transparent transition-colors duration-200'
                  : 'relative z-[1] mt-1 text-[12px] text-[#97929f] transition-colors duration-200'
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
