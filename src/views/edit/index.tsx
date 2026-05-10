'use client';
import { memo, useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { useSearchParams } from 'next/navigation';
import { resumeTemplates } from '@/json/resumeTemplates';
import { configStore } from '@/mobx';
import Canvas from './components/canvas';
import Container from './components/container';
import Header from './components/header';
import Menu from './components/menu/index';

const DEFAULT_MENU_KEY = 'resume';

function Edit() {
  const searchParams = useSearchParams();
  const [menuActiveKey, setMenuActiveKey] = useState(DEFAULT_MENU_KEY);
  useLayoutEffect(() => {
    const raw = searchParams.get('template');
    if (raw == null || raw === '') return;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1 || n > resumeTemplates.length) return;
    const tpl = resumeTemplates[n - 1];
    if (!tpl?.config) return;
    configStore.setConfig(JSON.parse(JSON.stringify(tpl.config)));
  }, [searchParams]);

  return (
    <div className='editor-shell-bg relative flex h-screen w-screen flex-col overflow-hidden text-[var(--text-strong)]'>
      <div className='editor-shell-grid pointer-events-none absolute inset-0 opacity-60' />
      <div className='relative z-[1] flex min-h-0 flex-1 flex-col gap-3 p-3 md:p-4'>
        <div className='editor-shell-card editor-shell-card-strong rounded-[26px] px-2 md:px-3'>
          <div className='h-[62px] w-full'>
            <Header />
          </div>
        </div>
        <div className='flex min-h-0 flex-1 gap-3'>
          <div className='editor-shell-card h-full min-h-0 rounded-[28px] overflow-hidden'>
            <Menu activeKey={menuActiveKey} onActiveKeyChange={setMenuActiveKey} />
          </div>
          <div className='editor-shell-card h-full min-h-0 rounded-[28px] overflow-hidden'>
            <Container menuActiveKey={menuActiveKey} />
          </div>
          <div className='editor-shell-card editor-shell-card-strong box-border flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[32px]'>
            <Canvas onOpenGeneralSettings={() => setMenuActiveKey('general-settings')} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(observer(Edit));
