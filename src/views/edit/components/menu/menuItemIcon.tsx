import AppstoreOutlined from '@ant-design/icons/AppstoreOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import ProfileOutlined from '@ant-design/icons/ProfileOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import SlidersOutlined from '@ant-design/icons/SlidersOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';
import { EditTwo, Magic, Peoples, Scanning } from '@icon-park/react';
import AiToolsIcon from './AiToolsIcon';

type MenuItemIconProps = {
  menuKey: string;
  selected: boolean;
};

const ICON_FILL = 'var(--color-primary)';
const ICON_MUTED = 'var(--menu-icon-muted)';

export default function MenuItemIcon({ menuKey, selected }: MenuItemIconProps) {
  const fill = selected ? ICON_FILL : ICON_MUTED;
  const antIconCls = `relative z-[1] mb-0.5 text-[20px] transition-[color,fill] duration-200 [&_svg]:!fill-current ${selected ? 'text-[color:var(--color-primary)]' : 'text-[var(--menu-icon-muted)]'}`;
  const aiToolsCls = `relative z-[1] mb-0.5 transition-colors duration-200 ${
    selected ? 'text-current' : 'text-[var(--menu-icon-muted)]'
  }`;

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
  if (menuKey === 'my-resumes') return <FileTextOutlined className={antIconCls} />;
  if (menuKey === 'resume') return <ProfileOutlined className={antIconCls} />;
  if (menuKey === 'resume-template') return <AppstoreOutlined className={antIconCls} />;
  if (menuKey === 'general-settings') return <SettingOutlined className={antIconCls} />;
  if (menuKey === 'page-settings') return <SlidersOutlined className={antIconCls} />;
  if (menuKey === 'ai-tools') {
    return <AiToolsIcon size={24} className={`${aiToolsCls} size-6 shrink-0`} />;
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
  if (menuKey === 'ai-interview') {
    return (
      <Peoples
        theme='outline'
        size='20'
        fill={fill}
        className='relative z-[1] mb-0.5 transition-[fill] duration-200'
      />
    );
  }

  return <AiToolsIcon size={20} className={aiToolsCls} />;
}
