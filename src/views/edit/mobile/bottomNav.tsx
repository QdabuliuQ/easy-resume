'use client';

import { AppstoreOutlined, ExportOutlined, EyeOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import { resumeImportStore } from '@/mobx';

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
  const th = useTranslations('Edit.header');
  const importBusy = resumeImportStore.loading;
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
          const disabled = key === 'export' && importBusy;
          return (
            <button
              key={key}
              type='button'
              disabled={disabled}
              title={disabled ? th('importBusy') : undefined}
              onClick={() => {
                if (disabled) return;
                onChange(key);
              }}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                disabled
                  ? 'cursor-not-allowed text-fg/28'
                  : on
                    ? 'cursor-pointer text-[var(--color-primary)]'
                    : 'cursor-pointer text-fg/48'
              }`}
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

export default memo(observer(MobileBottomNav));
