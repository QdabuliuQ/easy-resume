'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import defaultResume from '@/json/resume.defaults';
import { loadResumeTemplateByIndex } from '@/lib/loadResumeTemplates';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';
import { consumeResumeAuthDraft } from '@/lib/resumeAuthDraft';
import { configStore, editHistoryStore } from '@/mobx';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import Container from '../components/container';
import ResumeConfigCanvasPreviewHost from '../components/resumeConfigCanvasPreviewHost';
import { AiInterviewSkeleton } from '../components/panel/components/settingsSkeletons';
import MobileEditHeader from './header';
import MobileMainTabs from './mainTabs';
import MobileBottomNav, { type MobileBottomKey } from './bottomNav';
import { MobileEditProvider } from './context';

const AiInterviewPage = dynamic(() => import('../components/aiInterview'), {
  ssr: false,
  loading: () => <AiInterviewSkeleton />,
});

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

function MobileEditInner() {
  const t = useTranslations('Edit.aiInterview');
  const searchParams = useSearchParams();
  const [menuActiveKey, setMenuActiveKey] = useState(DEFAULT_MENU_KEY);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const interviewLiveRef = useRef(false);
  const { confirm } = useResponsiveConfirm();
  const isInterview = menuActiveKey === 'ai-interview';

  useLayoutEffect(() => {
    const draft = consumeResumeAuthDraft();
    if (draft) {
      editHistoryStore.clear();
      configStore.setConfig(draft, { source: 'reset' });
      resetAiModifyChatSession();
      return;
    }
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

  const changeMenuKey = useCallback(
    (
      key: 'resume' | 'page-settings' | 'ai-score' | 'ai-modify' | 'ai-interview' | 'general-settings',
    ) => {
      if (menuActiveKey === 'ai-interview' && key !== 'ai-interview' && interviewLiveRef.current) {
        confirm({
          title: t('leaveTitle'),
          content: t('leaveContent'),
          okText: t('leaveOk'),
          cancelText: t('leaveCancel'),
          danger: true,
          onOk: () => setMenuActiveKey(key),
        });
        return;
      }
      setMenuActiveKey(key);
    },
    [menuActiveKey, confirm, t],
  );

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

  const mainTabKey =
    menuActiveKey === 'resume-template'
      ? 'resume'
      : menuActiveKey === 'resume' ||
          menuActiveKey === 'page-settings' ||
          menuActiveKey === 'ai-score' ||
          menuActiveKey === 'ai-modify' ||
          menuActiveKey === 'ai-interview' ||
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
    <>
      <div className='mobile-edit-shell relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--editor-shell-bg)] text-[var(--text-strong)]'>
        <div className='relative z-[1] flex min-h-0 flex-1 flex-col'>
          <MobileEditHeader />
          <MobileMainTabs activeKey={mainTabKey} onChange={changeMenuKey} />
          <div className='flex min-h-0 w-full flex-1 flex-col overflow-hidden'>
            {isInterview ? (
              <AiInterviewPage
                onLiveChange={(live) => {
                  interviewLiveRef.current = live;
                }}
              />
            ) : (
              <Container menuActiveKey={menuActiveKey} fullWidth />
            )}
          </div>
          <MobileBottomNav activeKey={bottomActive} onChange={onBottomNav} />
        </div>
        {previewOpen ? <MobilePreviewOverlay onClose={() => setPreviewOpen(false)} /> : null}
        {exportOpen ? (
          <MobileExportSheet visible={exportOpen} onClose={() => setExportOpen(false)} />
        ) : null}
        {templateOpen ? <MobileTemplateOverlay onClose={() => setTemplateOpen(false)} /> : null}
        <ResumeConfigCanvasPreviewHost />
      </div>
    </>
  );
}

function MobileEdit() {
  return (
    <MobileEditProvider>
      <MobileEditInner />
    </MobileEditProvider>
  );
}

export default memo(observer(MobileEdit));
