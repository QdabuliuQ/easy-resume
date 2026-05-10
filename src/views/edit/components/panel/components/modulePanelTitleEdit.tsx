'use client';
import { Edit } from '@icon-park/react';
import { Input } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useState } from 'react';

export type ModulePanelTitleEditProps = {
  resetKey: string;
  title: string;
  fallbackTitle: string;
  maxLength?: number;
  disabled?: boolean;
  onCommit: (nextTitle: string) => void;
};

function ModulePanelTitleEdit({
  resetKey,
  title,
  fallbackTitle,
  maxLength = 40,
  disabled = false,
  onCommit,
}: ModulePanelTitleEditProps) {
  const tm = useTranslations('Edit.modulePanel');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  useEffect(() => {
    setEditing(false);
  }, [resetKey]);
  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);
  const commit = useMemoizedFn(() => {
    if (disabled) {
      setEditing(false);
      return;
    }
    const v = draft.trim();
    onCommit(v || fallbackTitle);
    setEditing(false);
  });
  const display = (title || '').trim() || fallbackTitle;
  return (
    <div className='ml-[10px] flex min-w-0 flex-1 items-center gap-1.5'>
      <div className='min-w-0'>
        {editing ? (
          <Input
            autoFocus
            maxLength={maxLength}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
            className='panel-title-input text-[15px]'
          />
        ) : (
          <span className='block truncate text-[15px] font-medium text-fg/95'>{display}</span>
        )}
      </div>
      {
        !editing && (
          <button
            type='button'
            aria-label={tm('editTitleAria')}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setDraft(title);
              setEditing(true);
            }}
            className='panel-title-edit-btn disabled:pointer-events-none disabled:opacity-60'
          >
            <Edit theme='outline' size={16} fill='currentColor' />
          </button>
        )
      }

    </div>
  );
}

export default memo(ModulePanelTitleEdit);
