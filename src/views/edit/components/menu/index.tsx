import { ProfileOutlined } from '@ant-design/icons';

const GRADIENT_ID = 'resume-menu-item-grad';

type MenuProps = {
  activeKey: string;
  onActiveKeyChange: (key: string) => void;
};

export default function Menu({ activeKey, onActiveKeyChange }: MenuProps) {
  const menuItems = [
    {
      label: '简历编辑',
      icon: (
        <ProfileOutlined className='text-[23px] [&_path]:fill-[url(#resume-menu-item-grad)]' />
      ),
      key: 'resume',
    },
  ];

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
      {menuItems.map((item) => (
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
            activeKey === item.key
              ? 'bg-[#38363a]'
              : 'bg-transparent hover:bg-white/5'
          }`}
        >
          {item.icon}
          <span className='bg-gradient-primary mt-[5px] bg-clip-text text-[12px] text-transparent'>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
