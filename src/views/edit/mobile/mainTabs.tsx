'use client';

import {
  ProfileOutlined,
  SettingOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Magic } from '@icon-park/react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

const TABS = [
  { key: 'resume', icon: ProfileOutlined },
  { key: 'page-settings', icon: SlidersOutlined },
  { key: 'ai-score', icon: Magic },
  { key: 'general-settings', icon: SettingOutlined },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function MobileMainTabs({
  activeKey,
  onChange,
}: {
  activeKey: string;
  onChange: (key: TabKey) => void;
}) {
  const t = useTranslations('Edit.mobile');
  const labels: Record<TabKey, string> = {
    resume: t('tabResume'),
    'page-settings': t('tabPage'),
    'ai-score': t('tabAi'),
    'general-settings': t('tabGeneral'),
  };
  return (
    <nav className='shrink-0 border-b border-fg/10 px-2'>
      <div className='grid grid-cols-4 gap-0.5'>
        {TABS.map(({ key, icon: Icon }) => {
          const on = activeKey === key;
          return (
            <button
              key={key}
              type='button'
              onClick={() => onChange(key)}
              className={`relative flex cursor-pointer flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${on ? 'text-[var(--color-primary)]' : 'text-fg/50'}`}
            >
              {on ? (
                <span className='absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--color-primary-gradient-start)] to-[var(--color-primary)]' />
              ) : null}
              {key === 'ai-score' ? (
                <Magic
                  theme='outline'
                  size={20}
                  fill={on ? 'var(--color-primary)' : 'var(--menu-icon-muted)'}
                />
              ) : (
                <Icon className='text-[20px]' />
              )}
              <span className='max-w-full truncate px-0.5'>{labels[key]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default memo(MobileMainTabs);
