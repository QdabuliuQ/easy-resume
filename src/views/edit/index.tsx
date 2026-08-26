'use client';
import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useSearchParams } from 'next/navigation';
import { prefetchRichTextEditor } from '@/components/richTextEditor/lazy';
import defaultResume from '@/json/resume.defaults';
import { loadResumeTemplateByIndex } from '@/lib/loadResumeTemplates';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';
import { normResumeFont } from '@/lib/resumeFont';
import { configStore, editHistoryStore } from '@/mobx';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import Canvas from './components/canvas';
import Container from './components/container';
import EditShellReveal from './components/editShellReveal';
import Header from './components/header';
import Menu from './components/menu/index';
import ResumeConfigCanvasPreviewHost from './components/resumeConfigCanvasPreviewHost';
import ResumeFontCdn from './components/canvas/resumeFontCdn';
import EditTour from './components/editTour';

const AiInterviewPage = dynamic(() => import('./components/aiInterview'), { ssr: false });

const DEFAULT_MENU_KEY = 'resume';

function Edit() {
  const searchParams = useSearchParams();
  const [menuActiveKey, setMenuActiveKey] = useState(DEFAULT_MENU_KEY);
  const [shellRevealReady, setShellRevealReady] = useState(false);
  const interviewLiveRef = useRef(false);
  const { confirm, contextHolder } = useResponsiveConfirm();
  const resumeFont = normResumeFont(configStore.mergedGlobalStyle.resumeFont);
  const isInterview = menuActiveKey === 'ai-interview';

  const changeMenuKey = useCallback(
    (key: string) => {
      if (menuActiveKey === 'ai-interview' && key !== 'ai-interview' && interviewLiveRef.current) {
        confirm({
          title: '确认退出面试？',
          content: '退出后本场进度将丢失，无法恢复。',
          okText: '确认退出',
          cancelText: '继续面试',
          danger: true,
          onOk: () => setMenuActiveKey(key),
        });
        return;
      }
      setMenuActiveKey(key);
    },
    [menuActiveKey, confirm],
  );

  useEffect(() => {
    const id = window.setTimeout(() => prefetchRichTextEditor(), 4000);
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
    const id = requestAnimationFrame(() => setShellRevealReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className='editor-shell-bg relative flex h-screen w-screen flex-col overflow-hidden text-[var(--text-strong)]'>
      {contextHolder}
      <ResumeFontCdn font={resumeFont} />
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
              <Menu activeKey={menuActiveKey} onActiveKeyChange={changeMenuKey} />
            </div>
            {isInterview ? (
              <div
                data-edit-reveal='bottom'
                className='editor-shell-card editor-shell-card-strong box-border flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[32px]'
              >
                <AiInterviewPage
                  onLiveChange={(live) => {
                    interviewLiveRef.current = live;
                  }}
                />
              </div>
            ) : (
              <>
                <div
                  data-edit-reveal='bottom'
                  className='editor-shell-card h-full min-h-0 overflow-hidden rounded-[28px]'
                >
                  <Container menuActiveKey={menuActiveKey} />
                </div>
                <div
                  data-edit-reveal='right'
                  className='editor-shell-card editor-shell-card-strong box-border flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[32px]'
                >
                  <Canvas
                    onOpenGeneralSettings={() => changeMenuKey('general-settings')}
                    onOpenResumePanel={() => changeMenuKey('resume')}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </EditShellReveal>
      <EditTour ready={shellRevealReady} />
      <ResumeConfigCanvasPreviewHost />
    </div>
  );
}

export default memo(observer(Edit));
