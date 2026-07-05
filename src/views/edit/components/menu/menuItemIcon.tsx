import {
  AppstoreOutlined,
  ProfileOutlined,
  SettingOutlined,
  SlidersOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { EditTwo, Magic, Scanning } from '@icon-park/react';

type MenuItemIconProps = {
  menuKey: string;
  selected: boolean;
};

const ICON_FILL = 'var(--color-primary)';
const ICON_MUTED = 'var(--menu-icon-muted)';

export default function MenuItemIcon({ menuKey, selected }: MenuItemIconProps) {
  const fill = selected ? ICON_FILL : ICON_MUTED;
  const antIconCls = `relative z-[1] mb-0.5 text-[20px] transition-[color,fill] duration-200 [&_svg]:!fill-current ${selected ? 'text-[color:var(--color-primary)]' : 'text-[var(--menu-icon-muted)]'}`;

  if (menuKey === 'import-template') return <UploadOutlined className={antIconCls} />;
  if (menuKey === 'import-resume') {
    return (
      <Scanning
        theme='outline'
        size='20'
        fill={fill}
        className='relative z-[1] mb-0.5 transition-[fill] duration-200'
      />
    );
  }
  if (menuKey === 'resume') return <ProfileOutlined className={antIconCls} />;
  if (menuKey === 'resume-template') return <AppstoreOutlined className={antIconCls} />;
  if (menuKey === 'general-settings') return <SettingOutlined className={antIconCls} />;
  if (menuKey === 'page-settings') return <SlidersOutlined className={antIconCls} />;
  if (menuKey === 'ai-modify') {
    return (
      <EditTwo
        theme='outline'
        size='20'
        fill={fill}
        className='relative z-[1] mb-0.5 transition-[fill] duration-200'
      />
    );
  }
  if (menuKey === 'ai-score') {
    return (
      <Magic
        theme='outline'
        size='20'
        fill={fill}
        className='relative z-[1] mb-0.5 transition-[fill] duration-200'
      />
    );
  }

  return (
    <Magic
      theme='outline'
      size='20'
      fill={fill}
      className='relative z-[1] mb-0.5 transition-[fill] duration-200'
    />
  );
}
