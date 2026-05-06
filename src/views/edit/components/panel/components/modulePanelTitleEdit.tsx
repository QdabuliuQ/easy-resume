'use client';
import { Edit } from '@icon-park/react';
import { Input } from 'antd';
import { useMemoizedFn } from 'ahooks';
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
            className='w-full border-white/20 bg-white/10 text-[15px] text-white/95'
          />
        ) : (
          <span className='block truncate text-[15px] font-medium text-white/95'>{display}</span>
        )}
      </div>
      {
        !editing && (
          <button
            type='button'
            aria-label='编辑模块标题'
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              setDraft(title);
              setEditing(true);
            }}
            className='relative z-[1] inline-flex size-7 shrink-0 items-center justify-center rounded-md text-white/55 outline-none cursor-pointer hover:text-white/90 disabled:pointer-events-none disabled:opacity-60'
          >
            <Edit theme='outline' size={16} fill='currentColor' />
          </button>
        )
      }

    </div>
  );
}

export default memo(ModulePanelTitleEdit);
