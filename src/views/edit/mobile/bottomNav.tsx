'use client';

import { AppstoreOutlined, ExportOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

export type MobileBottomKey = 'preview' | 'export' | 'templates';

const ITEMS: { key: MobileBottomKey; icon: typeof EyeOutlined }[] = [
  { key: 'preview', icon: EyeOutlined },
  { key: 'export', icon: ExportOutlined },
  { key: 'templates', icon: AppstoreOutlined },
];

function MobileBottomNav({
  activeKey,
  onChange,
}: {
  activeKey: MobileBottomKey | null;
  onChange: (key: MobileBottomKey) => void;
}) {
  const t = useTranslations('Edit.mobile');
  const labels: Record<MobileBottomKey, string> = {
    preview: t('navPreview'),
    export: t('navExport'),
    templates: t('navTemplates'),
  };
  return (
    <nav className='shrink-0 border-t border-fg/10 bg-[var(--editor-shell-bg)]/98 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md'>
      <div className='grid grid-cols-3'>
        {ITEMS.map(({ key, icon: Icon }) => {
          const on = activeKey === key;
          return (
            <button
              key={key}
              type='button'
              onClick={() => onChange(key)}
              className={`flex cursor-pointer flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${on ? 'text-[var(--color-primary)]' : 'text-fg/48'}`}
            >
              <Icon className='text-[20px]' />
              <span>{labels[key]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default memo(MobileBottomNav);
