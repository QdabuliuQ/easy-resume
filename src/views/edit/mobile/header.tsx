'use client';

import Image from 'next/image';
import Link from 'next/link';
import { EditOutlined, RedoOutlined, UndoOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react';
import { useLocale, useTranslations } from 'next-intl';
import { memo, useRef, useState } from 'react';
import { Button, Input } from 'antd';
import { configStore } from '@/mobx';
import defaultResume from '@/json/resume.defaults';
import { localePath } from '@/lib/device';
import { logo } from '@/lib/brandAssets';
import { useEditHistory } from '@/views/edit/hooks/useEditHistory';

function MobileEditHeader() {
  const t = useTranslations('Edit.header');
  const { canUndo, canRedo, undo, redo } = useEditHistory();
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const ignoreNextBlur = useRef(false);
  const name = configStore.getConfig?.name ?? defaultResume.name;
  const commit = () => {
    const trimmed = draft.trim();
    const base = configStore.getConfig ?? JSON.parse(JSON.stringify(defaultResume));
    configStore.setConfig({ ...base, name: trimmed || name });
    ignoreNextBlur.current = true;
    setEditing(false);
    queueMicrotask(() => {
      ignoreNextBlur.current = false;
    });
  };
  return (
    <header className='relative shrink-0 border-b border-fg/10 px-4 pb-3 pt-3'>
      <div className='flex items-center gap-3'>
        <Link href={localePath(locale)} className='relative flex h-10 w-10 shrink-0'>
          <Image src={logo} alt={t('logoAlt')} fill sizes='40px' className='rounded-full object-contain' />
        </Link>
        <div className='min-w-0 flex-1'>
          {editing ? (
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (ignoreNextBlur.current) return;
                commit();
              }}
              onPressEnter={commit}
              maxLength={64}
              className='!h-8'
            />
          ) : (
            <div className='flex min-w-0 items-center gap-1'>
              <p className='truncate text-[15px] font-semibold text-fg/95'>{name}</p>
              <Button
                type='text'
                size='small'
                icon={<EditOutlined />}
                aria-label={t('editNameAria')}
                className='!h-7 !w-7 !min-w-7 shrink-0 !p-0'
                onClick={() => {
                  setDraft(name);
                  setEditing(true);
                }}
              />
            </div>
          )}
        </div>
      </div>
      <div className='pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1'>
        <Button
          type='text'
          size='small'
          icon={<UndoOutlined />}
          aria-label={t('undoAria')}
          disabled={!canUndo}
          onClick={undo}
          className='pointer-events-auto !h-8 !w-8 !min-w-8 !p-0 enabled:cursor-pointer disabled:!cursor-not-allowed'
        />
        <Button
          type='text'
          size='small'
          icon={<RedoOutlined />}
          aria-label={t('redoAria')}
          disabled={!canRedo}
          onClick={redo}
          className='pointer-events-auto !h-8 !w-8 !min-w-8 !p-0 enabled:cursor-pointer disabled:!cursor-not-allowed'
        />
      </div>
    </header>
  );
}

export default memo(observer(MobileEditHeader));
