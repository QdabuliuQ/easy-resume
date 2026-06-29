import {
  AppstoreOutlined,
  FileTextOutlined,
  ProfileOutlined,
  SettingOutlined,
  SlidersOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Magic } from '@icon-park/react';
import { MENU_GRADIENT_ID } from './menuGradientDefs';

type MenuItemIconProps = {
  menuKey: string;
  selected: boolean;
};

export default function MenuItemIcon({ menuKey, selected }: MenuItemIconProps) {
  const antIconCls = selected
    ? 'relative z-[1] text-[20px] mb-[3px] transition-[fill] duration-200 [&_svg]:!fill-[url(#resume-menu-item-grad)]'
    : 'relative z-[1] text-[20px] mb-[3px] transition-[fill] duration-200 [&_svg]:!fill-[var(--menu-icon-muted)]';

  if (menuKey === 'import-template') return <UploadOutlined className={antIconCls} />;
  if (menuKey === 'import-resume') return <FileTextOutlined className={antIconCls} />;
  if (menuKey === 'resume') return <ProfileOutlined className={antIconCls} />;
  if (menuKey === 'resume-template') return <AppstoreOutlined className={antIconCls} />;
  if (menuKey === 'general-settings') return <SettingOutlined className={antIconCls} />;
  if (menuKey === 'page-settings') return <SlidersOutlined className={antIconCls} />;

  return (
    <Magic
      theme='outline'
      size='20'
      fill={selected ? `url(#${MENU_GRADIENT_ID})` : 'var(--menu-icon-muted)'}
      className='relative z-[1] transition-[fill] duration-200 mb-[3px]'
    />
  );
}
