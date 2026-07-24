'use client';

import dynamic from 'next/dynamic';
import { memo, useLayoutEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { useSearchParams } from 'next/navigation';
import defaultResume from '@/json/resume.defaults';
import { loadResumeTemplateByIndex } from '@/lib/loadResumeTemplates';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';
import { configStore, editHistoryStore } from '@/mobx';
import Container from '../components/container';
import ResumeConfigCanvasPreviewHost from '../components/resumeConfigCanvasPreviewHost';
import MobileEditHeader from './header';
import MobileMainTabs from './mainTabs';
import MobileBottomNav, { type MobileBottomKey } from './bottomNav';
import { MobileEditProvider } from './context';

const MobilePreviewOverlay = dynamic(() => import('./previewOverlay'), {
  ssr: false,
});
const MobileExportSheet = dynamic(() => import('./exportSheet'), {
  ssr: false,
});
const MobileTemplateOverlay = dynamic(() => import('./templateOverlay'), {
  ssr: false,
});

const DEFAULT_MENU_KEY = 'resume';
function MobileEdit() {
  const searchParams = useSearchParams();
  const [menuActiveKey, setMenuActiveKey] = useState(DEFAULT_MENU_KEY);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  useLayoutEffect(() => {
    const raw = searchParams.get('template');
    if (raw != null && raw !== '') {
      const n = Number.parseInt(raw, 10);
      void loadResumeTemplateByIndex(n).then((tpl) => {
        if (tpl?.config) {
          editHistoryStore.clear();
          configStore.setConfig(JSON.parse(JSON.stringify(tpl.config)), { source: 'reset' });
          resetAiModifyChatSession();
        }
      });
      return;
    }
    if (!configStore.getConfig?.pages?.length) {
      editHistoryStore.clear();
      configStore.setConfig(JSON.parse(JSON.stringify(defaultResume)), { source: 'reset' });
    }
  }, [searchParams]);

  const onBottomNav = (key: MobileBottomKey) => {
    if (key === 'preview') {
      setPreviewOpen(true);
      return;
    }
    if (key === 'export') {
      setExportOpen(true);
      return;
    }
    if (key === 'templates') {
      setTemplateOpen(true);
      setPreviewOpen(false);
      setExportOpen(false);
    }
  };

  const onMainTab = (key: 'resume' | 'page-settings' | 'ai-score' | 'general-settings') => {
    setMenuActiveKey(key);
  };

  const mainTabKey =
    menuActiveKey === 'resume-template'
      ? 'resume'
      : menuActiveKey === 'resume' ||
          menuActiveKey === 'page-settings' ||
          menuActiveKey === 'ai-score' ||
          menuActiveKey === 'general-settings'
        ? menuActiveKey
        : DEFAULT_MENU_KEY;

  const bottomActive: MobileBottomKey | null = previewOpen
    ? 'preview'
    : exportOpen
      ? 'export'
      : templateOpen
        ? 'templates'
        : null;

  return (
    <MobileEditProvider>
    <div className='mobile-edit-shell relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--editor-shell-bg)] text-[var(--text-strong)]'>
      <div className='editor-shell-grid pointer-events-none absolute inset-0 opacity-40' />
      <div className='relative z-[1] flex min-h-0 flex-1 flex-col'>
        <MobileEditHeader />
        <MobileMainTabs activeKey={mainTabKey} onChange={onMainTab} />
        <div className='flex min-h-0 w-full flex-1 flex-col overflow-hidden'>
          <Container menuActiveKey={menuActiveKey} fullWidth />
        </div>
        <MobileBottomNav activeKey={bottomActive} onChange={onBottomNav} />
      </div>
      {previewOpen ? (
        <MobilePreviewOverlay
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
      {exportOpen ? (
        <MobileExportSheet visible={exportOpen} onClose={() => setExportOpen(false)} />
      ) : null}
      {templateOpen ? (
        <MobileTemplateOverlay onClose={() => setTemplateOpen(false)} />
      ) : null}
      <ResumeConfigCanvasPreviewHost />
    </div>
    </MobileEditProvider>
  );
}

export default memo(observer(MobileEdit));
