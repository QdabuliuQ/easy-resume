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
    <div className='relative w-[100px] h-full bg-[#444145] flex flex-col'>
      <svg width={0} height={0} className='absolute' aria-hidden>
        <defs>
          <linearGradient id={GRADIENT_ID} x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='#FCEA88' />
            <stop offset='100%' stopColor='#E46642' />
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
          className={`w-full py-[10px] flex cursor-pointer flex-col items-center justify-center gap-0.5 text-[13px] transition-colors select-none rounded-tl-[10px] rounded-bl-[10px] ${
            activeKey === item.key
              ? 'bg-[#38363a]'
              : 'bg-transparent hover:bg-white/5'
          }`}
        >
          {item.icon}
          <span className='bg-gradient-to-r from-[#FCEA88] to-[#E46642] bg-clip-text text-transparent mt-[5px] text-[12px]'>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
