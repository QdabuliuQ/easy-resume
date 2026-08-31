'use client';
import { AppstoreOutlined, EyeOutlined } from '@ant-design/icons';
import { useAppMessage } from '@/hooks/useAppMessage';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { useMemoizedFn } from 'ahooks';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ResumePageSkeleton from '@/components/resume/ResumePageSkeleton';
import defaultResume from '@/json/resume.defaults';
import type { ResumeTemplateItem } from '@/json/resumeTemplates';
import { panelListThumbUrl } from '@/lib/cdnThumbUrl';
import { loadResumeTemplates } from '@/lib/loadResumeTemplates';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Page } from '@/modules';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { configStore, editHistoryStore, moduleActiveStore } from '@/mobx';
import { resumePreviewStore } from '@/mobx/resumePreviewStore';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';
import ResumeFontCdn from '@/views/edit/components/canvas/resumeFontCdn';
import { ResumeTemplateSkeleton } from '@/views/edit/components/panel/components/settingsSkeletons';

/** 侧栏模板卡片内仅预览首页，缩放略小于走马灯以便双列容纳 */
export const TEMPLATE_CARD_PREVIEW_SCALE = 0.2;

export const TemplateFirstPagePreview = memo(function TemplateFirstPagePreview({
  template,
  config: configProp,
  scale,
}: {
  template?: ResumeTemplateItem;
  config?: ResumeTemplateItem['config'];
  scale: number;
}) {
  const config = configProp ?? template?.config;
  const previewImage = template?.previewImage?.trim() || '';
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgReady, setImgReady] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  const thumbSrc = useMemo(() => {
    if (!previewImage) return '';
    return useOriginal ? previewImage : panelListThumbUrl(previewImage);
  }, [previewImage, useOriginal]);
  const gs = useMemo(
    () => mergeGlobalStylePaper(defaultResume.globalStyle as GlobalStyle, config?.globalStyle ?? {}),
    [config]
  );
  const { width: pwStr, height: phStr } = globalStylePageDimensions(gs);
  const pw = cssLengthToApproxPx(pwStr);
  const ph = cssLengthToApproxPx(phStr);
  const modules = useMemo(() => {
    const page = config?.pages?.[0];
    return page?.modules ?? [];
  }, [config]);
  const needLive = !previewImage || imgFailed;
  const { main, sideSlot } = useMemo(
    () =>
      needLive
        ? renderResumePageModules(modules as unknown[], gs, { isFirstPage: true })
        : { main: null, sideSlot: null },
    [modules, gs, needLive],
  );

  useEffect(() => {
    setImgReady(false);
    setImgFailed(false);
    setUseOriginal(false);
  }, [previewImage, template?.id]);

  useLayoutEffect(() => {
    const img = imgRef.current;
    if (!thumbSrc || imgFailed || !img) return;
    if (img.complete && img.naturalWidth > 0) setImgReady(true);
  }, [thumbSrc, imgFailed]);

  if (!config) return null;
  const boxStyle = { width: pw * scale, height: ph * scale, colorScheme: 'light' as const };
  if (previewImage && !imgFailed) {
    return (
      <div
        className='relative isolate shrink-0 overflow-hidden rounded-md bg-white text-left shadow-sm ring-1 ring-black/6'
        style={boxStyle}
        aria-busy={!imgReady}
      >
        <div
          className={`absolute inset-0 z-0 transition-opacity duration-300 motion-reduce:transition-none${imgReady ? ' pointer-events-none opacity-0' : ' opacity-100'}`}
          aria-hidden={imgReady}
        >
          <ResumePageSkeleton />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={thumbSrc}
          alt={template?.title || ''}
          draggable={false}
          decoding='async'
          className={`relative z-[1] h-full w-full object-cover object-top transition-opacity duration-300 motion-reduce:transition-none${imgReady ? ' opacity-100' : ' opacity-0'}`}
          onLoad={() => setImgReady(true)}
          onError={() => {
            if (!useOriginal && previewImage) {
              setImgReady(false);
              setUseOriginal(true);
              return;
            }
            setImgFailed(true);
          }}
        />
      </div>
    );
  }
  return (
    <div
      className='relative isolate shrink-0 overflow-hidden rounded-md bg-white text-left text-[#333] leading-normal font-normal shadow-sm ring-1 ring-black/6'
      style={boxStyle}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: pwStr,
          height: phStr,
        }}
      >
        <ResumeFontCdn font={gs.resumeFont} />
        <Page {...gs} firstPage sideSlot={sideSlot ?? undefined}>
          {main}
        </Page>
      </div>
    </div>
  );
});

function ResumeTemplate() {
  const message = useAppMessage();
  const tr = useTranslations('Edit.resumeTemplate');
  const { confirm, modal, mobile } = useResponsiveConfirm();
  const [templates, setTemplates] = useState<ResumeTemplateItem[]>([]);
  useEffect(() => {
    let cancelled = false;
    void loadResumeTemplates().then((list) => {
      if (!cancelled) setTemplates(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const templateCards = useMemo(
    () =>
      templates.map((template, index) => {
        const pageCount = template.config.pages.length;
        const moduleCount = template.config.pages.reduce(
          (total, page) => total + page.modules.length,
          0
        );

        return {
          ...template,
          orderLabel: tr('orderLabel', { n: String(index + 1).padStart(2, '0') }),
          pageCount,
          moduleCount,
        };
      }),
    [templates, tr]
  );

  const applyTemplate = (tpl: ResumeTemplateItem) => {
    editHistoryStore.clear();
    configStore.setConfig(JSON.parse(JSON.stringify(tpl.config)), { source: 'reset' });
    moduleActiveStore.setModuleActive('global');
    resetAiModifyChatSession();
    message.success(tr('appliedOk'));
  };
  const onPick = useMemoizedFn((tpl: ResumeTemplateItem) => {
    if (mobile) {
      confirm({
        title: tr('replaceTitle'),
        content: (
          <div className='space-y-2'>
            <span className='block text-[13px] leading-relaxed text-fg/70'>
              {tr('replaceBody')}
            </span>
            <span className='inline-flex rounded-full border border-fg/[0.08] bg-surface/[0.05] px-2.5 py-1 text-[11px] font-medium text-fg/58'>
              {tr('replaceRecommend')}
            </span>
          </div>
        ),
        okText: tr('okReplace'),
        cancelText: tr('cancel'),
        danger: true,
        onOk: () => applyTemplate(tpl),
      });
      return;
    }
    modal.confirm({
      icon: null,
      title: (
        <div className='flex items-center gap-2 text-[15px] font-semibold !text-fg/95'>
          <span className='flex h-8 w-8 items-center justify-center rounded-xl border border-fg/[0.08] bg-surface/[0.05]'>
            <AppstoreOutlined className='text-[15px] [&_svg]:!fill-[var(--color-primary)]' />
          </span>
          <span>{tr('replaceTitle')}</span>
        </div>
      ),
      content: (
        <div className='space-y-2'>
          <span className='block text-[13px] leading-relaxed !text-fg/70'>
            {tr('replaceBody')}
          </span>
          <span className='inline-flex rounded-full border border-fg/[0.08] bg-surface/[0.05] px-2.5 py-1 text-[11px] font-medium text-fg/58'>
            {tr('replaceRecommend')}
          </span>
        </div>
      ),
      okText: tr('okReplace'),
      cancelText: tr('cancel'),
      centered: true,
      okButtonProps: {
        danger: true,
        className:
          '!rounded-xl !border-0 !bg-[var(--color-primary)] !shadow-none hover:!brightness-110',
      },
      cancelButtonProps: {
        className:
          '!rounded-xl !border-fg/[0.08] !bg-surface/[0.04] !text-fg/72 hover:!border-fg/[0.14] hover:!bg-surface/[0.08]',
      },
      wrapClassName:
        '[&_.ant-modal-confirm-title]:!text-fg/95 [&_.ant-modal-confirm-content]:!text-fg/70',
      styles: {
        content: {
          background:
            'linear-gradient(180deg, rgb(var(--panel-surface-rgb)/0.07) 0%, rgb(var(--panel-surface-rgb)/0.03) 100%), var(--antd-popup-panel)',
          padding: 20,
          border: '1px solid rgb(var(--panel-surface-rgb)/0.08)',
          borderRadius: 20,
          boxShadow: 'var(--editor-shell-shadow)',
        },
        header: { background: 'transparent' },
        body: { background: 'transparent' },
        footer: { background: 'transparent' },
      },
      classNames: {
        mask: '!bg-[color-mix(in_srgb,var(--overlay-scrim)_65%,transparent)]',
      },
      onOk: () => applyTemplate(tpl),
    });
  });

  return (
    <>
      <div className='relative flex h-full min-h-0 flex-col gap-3 overflow-auto px-0.5 pt-0.5 text-left'>
        {!templateCards.length ? (
          <ResumeTemplateSkeleton />
        ) : (
        <ul className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          {templateCards.map((t) => (
            <li key={t.id} className='min-w-0'>
              <div className='group flex w-full flex-col overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.055)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),var(--panel-layer-deep)] text-left shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-card-tight)] transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--color-primary)_42%,rgb(var(--panel-surface-rgb)/0.12))] hover:bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.07)_0%,rgb(var(--panel-surface-rgb)/0.03)_100%),var(--panel-layer-deep)] hover:shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.05),var(--panel-shadow-hover-card)]'>
                <div className='flex items-center justify-between gap-2 border-b border-fg/[0.06] bg-surface/[0.03] px-3 py-2'>
                  <span className='inline-flex items-center whitespace-nowrap rounded-full border border-fg/[0.08] bg-surface/[0.04] px-2 py-0.5 text-[10px] font-medium text-fg/62'>
                    {t.orderLabel}
                  </span>
                  <span className='truncate text-[12px] font-semibold text-fg/88 group-hover:text-fg'>
                    {t.title}
                  </span>
                </div>
                <div className='flex justify-center overflow-hidden bg-[rgb(var(--surface-fg-rgb)/0.04)]'>
                  <div className='pointer-events-none max-h-[220px] overflow-hidden'>
                    <TemplateFirstPagePreview template={t} scale={TEMPLATE_CARD_PREVIEW_SCALE} />
                  </div>
                </div>
                <div className='flex items-center gap-2 border-t border-fg/[0.06] px-3 py-2'>
                  <button
                    type='button'
                    onClick={() =>
                      resumePreviewStore.openWithConfig(
                        t.config,
                        `${tr('previewTitle')} · ${t.title}`,
                        t.previewImage,
                      )
                    }
                    className='inline-flex h-7 flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-fg/[0.12] bg-surface/[0.04] px-2 text-[11px] font-medium text-fg/72 transition-colors hover:border-fg/[0.18] hover:bg-surface/[0.08] hover:text-fg/88'
                  >
                    <EyeOutlined className='text-[12px]' />
                    {tr('preview')}
                  </button>
                  <button
                    type='button'
                    onClick={() => onPick(t)}
                    className='inline-flex h-7 flex-1 cursor-pointer items-center justify-center rounded-md border border-[color:color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-2 text-[11px] font-medium text-[color:var(--color-primary)] transition-colors hover:border-[color:color-mix(in_srgb,var(--color-primary)_38%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)]'
                  >
                    {tr('apply')}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        )}
      </div>
    </>
  );
}

export default memo(ResumeTemplate);
