'use client';
import { AppstoreOutlined } from '@ant-design/icons';
import { useAppMessage } from '@/hooks/useAppMessage';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { useMemoizedFn } from 'ahooks';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useMemo, useState } from 'react';
import defaultResume from '@/json/resume.defaults';
import type { ResumeTemplateItem } from '@/json/resumeTemplates';
import { loadResumeTemplates } from '@/lib/loadResumeTemplates';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { Page } from '@/modules';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { configStore, moduleActiveStore } from '@/mobx';
import { renderResumePageModules } from '@/views/edit/components/canvas/renderResumePageModules';
import ResumeFontCdn from '@/views/edit/components/canvas/resumeFontCdn';

/** 侧栏模板卡片内仅预览首页，缩放略小于走马灯以便双列容纳 */
export const TEMPLATE_CARD_PREVIEW_SCALE = 0.2;

export const TemplateFirstPagePreview = memo(function TemplateFirstPagePreview({
  template,
  scale,
}: {
  template: ResumeTemplateItem;
  scale: number;
}) {
  const gs = useMemo(
    () => mergeGlobalStylePaper(defaultResume.globalStyle as GlobalStyle, template.config.globalStyle),
    [template]
  );
  const { width: pwStr, height: phStr } = globalStylePageDimensions(gs);
  const pw = cssLengthToApproxPx(pwStr);
  const ph = cssLengthToApproxPx(phStr);
  const modules = useMemo(() => {
    const page = template.config.pages?.[0];
    return page?.modules ?? [];
  }, [template]);
  const { main, sideSlot } = useMemo(
    () => renderResumePageModules(modules as unknown[], gs, { isFirstPage: true }),
    [modules, gs],
  );
  return (
    <div
      className='relative isolate shrink-0 overflow-hidden rounded-md bg-white text-left text-[#333] leading-normal font-normal shadow-sm ring-1 ring-black/6'
      style={{ width: pw * scale, height: ph * scale, colorScheme: 'light' }}
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
  const { confirm, modal, mobile, contextHolder } = useResponsiveConfirm();
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
    configStore.setConfig(JSON.parse(JSON.stringify(tpl.config)));
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
      {contextHolder}
      <div className='relative flex h-full min-h-0 flex-col gap-3 overflow-auto px-0.5 pt-0.5 text-left'>
        {!templateCards.length ? (
          <div className='flex items-center justify-center gap-2 py-16 text-[13px] text-fg/58'>
            <span
              className='inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-fg/25 border-t-[color:var(--color-primary)]'
              aria-hidden
            />
          </div>
        ) : (
        <ul className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          {templateCards.map((t) => (
            <li key={t.id} className='min-w-0'>
              <button
                type='button'
                onClick={() => onPick(t)}
                className='group flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.055)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),var(--panel-layer-deep)] text-left shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-card-tight)] transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--color-primary)_42%,rgb(var(--panel-surface-rgb)/0.12))] hover:bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.07)_0%,rgb(var(--panel-surface-rgb)/0.03)_100%),var(--panel-layer-deep)] hover:shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.05),var(--panel-shadow-hover-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]'
              >
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
                <div className='border-t border-fg/[0.06] px-3 py-2.5'>
                  <span className='flex justify-center items-center whitespace-nowrap rounded-lg border border-[color:color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-primary)] transition-colors group-hover:border-[color:color-mix(in_srgb,var(--color-primary)_38%,transparent)] group-hover:bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)]'>
                    {tr('apply')}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
        )}
      </div>
    </>
  );
}

export default memo(ResumeTemplate);
