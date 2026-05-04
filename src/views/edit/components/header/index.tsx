import { memo, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { Button, Input, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { configStore } from '@/mobx';
import defaultResume from '@/json/resume';
import resume from '@/json/resume';
import ModuleManage from './moduleManage';

function Header() {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
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

  const exportPdf = async () => {
    if (typeof window === 'undefined' || pdfLoading) return;
    setPdfLoading(true);
    try {
      const base = (name || '简历').trim() || '简历';
      const safe = base.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: configStore.getConfig ?? defaultResume,
          filename: `${safe}.pdf`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === 'string' ? data.error : `请求失败 ${res.status}`
        );
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
      message.success('已导出 PDF');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '导出失败');
    } finally {
      setPdfLoading(false);
    }
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
      <div className='flex h-full items-center gap-2'>
        <ModuleManage />
        <button
          type='button'
          disabled={pdfLoading}
          onClick={() => void exportPdf()}
          className='bg-gradient-primary inline-flex h-[30px] min-w-[100px] cursor-pointer items-center justify-center gap-2 rounded-full border-0 px-[20px] text-[13px] font-bold text-[#333] shadow-none hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 text-white'
        >
          {pdfLoading ? (
            <>
              <span
                className='inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white'
                aria-hidden
              />
              <span>导出中…</span>
            </>
          ) : (
            '导出 PDF'
          )}
        </button>
        <div className='bg-gradient-primary flex h-[30px] cursor-pointer items-center justify-center rounded-full px-[20px] text-[13px] font-bold transition-[filter] duration-200 hover:brightness-110'>
          导出JSON
        </div>
      </div>
    </div>
  );
}

export default memo(observer(Header));
