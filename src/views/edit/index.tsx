'use client';
import { memo, useEffect, useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { useSearchParams } from 'next/navigation';
import { prefetchRichTextEditor } from '@/components/richTextEditor/lazy';
import defaultResume from '@/json/resume.defaults';
import { loadResumeTemplateByIndex } from '@/lib/loadResumeTemplates';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';
import { configStore, editHistoryStore } from '@/mobx';
import Canvas from './components/canvas';
import Container from './components/container';
import EditShellReveal from './components/editShellReveal';
import Header from './components/header';
import Menu from './components/menu/index';
import ResumeConfigCanvasPreviewHost from './components/resumeConfigCanvasPreviewHost';
import EditTour from './components/editTour';

const DEFAULT_MENU_KEY = 'resume';
const SHELL_REVEAL_FALLBACK_MS = 3000;

function Edit() {
  const searchParams = useSearchParams();
  const [menuActiveKey, setMenuActiveKey] = useState(DEFAULT_MENU_KEY);
  const [shellRevealReady, setShellRevealReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => prefetchRichTextEditor(), 1200);
    return () => clearTimeout(id);
  }, []);
  useLayoutEffect(() => {
    const raw = searchParams.get('template');
    const color = searchParams.get('color');
    if (raw != null && raw !== '') {
      const n = Number.parseInt(raw, 10);
      void loadResumeTemplateByIndex(n).then((tpl) => {
        if (!tpl?.config) return;
        const config = JSON.parse(JSON.stringify(tpl.config));
        if (color && typeof config.globalStyle === 'object') {
          config.globalStyle.color = color;
        }
        editHistoryStore.clear();
        configStore.setConfig(config, { source: 'reset' });
        resetAiModifyChatSession();
      });
      return;
    }
    if (!configStore.getConfig?.pages?.length) {
      const config = JSON.parse(JSON.stringify(defaultResume));
      if (color && typeof config.globalStyle === 'object') {
        config.globalStyle.color = color;
      }
      editHistoryStore.clear();
      configStore.setConfig(config, { source: 'reset' });
    }
  }, [searchParams]);
  useLayoutEffect(() => {
    if (shellRevealReady) return;
    const timer = setTimeout(() => setShellRevealReady(true), SHELL_REVEAL_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [shellRevealReady]);

  return (
    <div className='editor-shell-bg relative flex h-screen w-screen flex-col overflow-hidden text-[var(--text-strong)]'>
      <div className='editor-shell-grid pointer-events-none absolute inset-0 opacity-60' />
      <EditShellReveal revealReady={shellRevealReady}>
        <div className='relative z-[1] flex min-h-0 flex-1 flex-col gap-3 p-3 md:p-4'>
          <div
            data-edit-reveal='top'
            className='editor-shell-card editor-shell-card-strong rounded-[26px] px-2 md:px-3'
          >
            <div className='h-[62px] w-full'>
              <Header />
            </div>
          </div>
          <div className='flex min-h-0 flex-1 gap-3'>
            <div
              data-edit-reveal='left'
              className='editor-shell-card h-full min-h-0 overflow-visible rounded-[28px]'
            >
              <Menu activeKey={menuActiveKey} onActiveKeyChange={setMenuActiveKey} />
            </div>
            <div
              data-edit-reveal='bottom'
              className='editor-shell-card h-full min-h-0 rounded-[28px] overflow-hidden'
            >
              <Container menuActiveKey={menuActiveKey} />
            </div>
            <div
              data-edit-reveal='right'
              className='editor-shell-card editor-shell-card-strong box-border flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[32px]'
            >
              <Canvas
                onOpenGeneralSettings={() => setMenuActiveKey('general-settings')}
                onOpenResumePanel={() => setMenuActiveKey('resume')}
                onLayoutReady={() => setShellRevealReady(true)}
              />
            </div>
          </div>
        </div>
      </EditShellReveal>
      <EditTour ready={shellRevealReady} />
      <ResumeConfigCanvasPreviewHost />
    </div>
  );
}

export default memo(observer(Edit));
