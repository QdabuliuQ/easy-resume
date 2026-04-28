import { memo, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Button, Input } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { configStore } from '@/mobx';
import resume from '@/json/resume';
import ModuleManage from './moduleManage';

function Header() {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const ignoreNextBlur = useRef(false);

  const name = configStore.getConfig?.name ?? resume.name;

  const commit = () => {
    const trimmed = draft.trim();
    const base = configStore.getConfig ?? JSON.parse(JSON.stringify(resume));
    configStore.setConfig({ ...base, name: trimmed || name });
    ignoreNextBlur.current = true;
    setEditing(false);
    queueMicrotask(() => {
      ignoreNextBlur.current = false;
    });
  };

  const cancel = () => {
    ignoreNextBlur.current = true;
    setEditing(false);
    queueMicrotask(() => {
      ignoreNextBlur.current = false;
    });
  };

  const startEdit = () => {
    setDraft(name);
    setEditing(true);
  };

  const onBlur = () => {
    if (ignoreNextBlur.current) return;
    commit();
  };

  return (
    <div className='h-full px-[20px] flex items-center justify-between'>
      <div className='flex items-center gap-1.5 min-w-0 h-full'>
        {editing ? (
          <Input
            autoFocus
            variant='borderless'
            size='small'
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={onBlur}
            onPressEnter={commit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              }
            }}
            onFocus={(e) => e.target.select()}
            maxLength={64}
            className='max-w-[280px] min-w-[120px]'
            styles={{
              input: {
                backgroundColor: '#2a2a2a',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: 6,
                paddingInline: 8,
                height: 28,
              },
            }}
          />
        ) : (
          <>
            <span className='text-white text-[14px] leading-[22px] truncate' title={name}>
              {name}
            </span>
            <Button
              type='text'
              size='small'
              icon={<EditOutlined />}
              aria-label='编辑姓名'
              className='!text-[#aaa] hover:!text-white !p-0 !h-7 !w-7 !min-w-7 inline-flex items-center justify-center shrink-0'
              onClick={startEdit}
            />
          </>
        )}
      </div>
      <div className='flex h-full items-center'>
        <ModuleManage />
        <div className='flex h-[30px] cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[#FCEA88] to-[#E46642] px-[20px] text-[13px] font-bold transition-[filter] duration-200 hover:brightness-110'>
          导出JSON
        </div>
      </div>
    </div>
  );
}

export default memo(observer(Header));
