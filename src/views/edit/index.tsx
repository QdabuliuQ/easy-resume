'use client';
import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useMessages, useTranslations } from 'next-intl';
import { prefetchRichTextEditor } from '@/components/richTextEditor/lazy';
import defaultResume from '@/json/resume.defaults';
import { loadResumeTemplateByIndex } from '@/lib/loadResumeTemplates';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';
import { consumeResumeAuthDraft } from '@/lib/resumeAuthDraft';
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
import { AiInterviewSkeleton } from './components/panel/components/settingsSkeletons';
import { captureAndUploadTemplatePreview } from '@/lib/templatePreviewClient';

const AiInterviewPage = dynamic(() => import('./components/aiInterview'), {
  ssr: false,
  loading: () => <AiInterviewSkeleton />,
});

const DEFAULT_MENU_KEY = 'resume';

type EditProps = {
  templateMode?: boolean;
  templateId?: string;
  embedded?: boolean;
};

function Edit({ templateMode = false, templateId, embedded = false }: EditProps) {
  const t = useTranslations('Edit.aiInterview');
  const locale = useLocale();
  const messages = useMessages();
  const searchParams = useSearchParams();
  const [menuActiveKey, setMenuActiveKey] = useState(DEFAULT_MENU_KEY);
  const [shellRevealReady, setShellRevealReady] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const interviewLiveRef = useRef(false);
  const { confirm } = useResponsiveConfirm();
  const resumeFont = normResumeFont(configStore.mergedGlobalStyle.resumeFont);
  const isInterview = menuActiveKey === 'ai-interview';

  const changeMenuKey = useCallback(
    (key: string) => {
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

  useEffect(() => {
    const id = window.setTimeout(() => prefetchRichTextEditor(), 4000);
    return () => clearTimeout(id);
  }, []);

  useLayoutEffect(() => {
    if (templateMode && templateId) {
      editHistoryStore.clear();
      configStore.setConfig(JSON.parse(JSON.stringify(defaultResume)), { source: 'reset' });
      void fetch(`/api/admin/templates/${encodeURIComponent(templateId)}`, { cache: 'no-store' })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok || !data?.config) throw new Error(data?.error || '模板加载失败');
          editHistoryStore.clear();
          configStore.setConfig(data.config, { source: 'reset' });
        })
        .catch((error) => console.error('[TemplateEditor] load failed', error));
      return;
    }
    const draft = consumeResumeAuthDraft();
    if (draft) {
      editHistoryStore.clear();
      configStore.setConfig(draft, { source: 'reset' });
      resetAiModifyChatSession();
      return;
    }
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
  }, [searchParams, templateMode, templateId]);

  const saveTemplate = useCallback(() => {
    if (!templateMode || !templateId || templateSaving || !configStore.getConfig) return;
    setTemplateSaving(true);
    void fetch(`/api/admin/templates/${encodeURIComponent(templateId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: configStore.getConfig }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || '模板保存失败');
        try {
          await captureAndUploadTemplatePreview({
            templateId,
            config: configStore.getConfig,
            locale,
            messages: messages as Record<string, unknown>,
            exportPages: configStore.getExportPages,
            firstPageOnly: true,
          });
          window.alert('模板和预览图已保存');
        } catch (error) {
          window.alert(
            `模板已保存，但预览图上传失败：${error instanceof Error ? error.message : '未知错误'}`,
          );
        }
      })
      .catch((error) => window.alert(error instanceof Error ? error.message : '模板保存失败'))
      .finally(() => setTemplateSaving(false));
  }, [locale, messages, templateId, templateMode, templateSaving]);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setShellRevealReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`editor-shell-bg relative flex flex-col overflow-hidden text-[var(--text-strong)] ${embedded ? 'h-full w-full' : 'h-screen w-screen'}`}
    >
      <ResumeFontCdn font={resumeFont} />
      <EditShellReveal revealReady={shellRevealReady}>
        <div className='relative z-[1] flex min-h-0 flex-1 flex-col gap-3 p-3 md:p-4'>
          <div
            data-edit-reveal='top'
            className='editor-shell-card editor-shell-card-strong rounded-[26px] px-2 md:px-3'
          >
            <div className='h-[62px] w-full'>
            <Header
              templateMode={templateMode}
              templateSaving={templateSaving}
              onTemplateSave={saveTemplate}
            />
            </div>
          </div>
          <div className='flex min-h-0 flex-1 gap-3'>
            <div
              data-edit-reveal='left'
              className='editor-shell-card h-full min-h-0 overflow-visible rounded-[28px]'
            >
              <Menu
                activeKey={menuActiveKey}
                onActiveKeyChange={changeMenuKey}
                templateMode={templateMode}
              />
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
                    menuActiveKey={menuActiveKey}
                    templateMode={templateMode}
                    onOpenGeneralSettings={() => changeMenuKey('general-settings')}
                    onOpenResumePanel={() => changeMenuKey('resume')}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </EditShellReveal>
      {!templateMode ? <EditTour ready={shellRevealReady} /> : null}
      <ResumeConfigCanvasPreviewHost />
    </div>
  );
}

export default memo(observer(Edit));
