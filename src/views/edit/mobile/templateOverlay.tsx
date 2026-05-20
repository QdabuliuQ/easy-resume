'use client';

import { CloseOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { useTranslations } from 'next-intl';
import { memo, useEffect, useMemo } from 'react';
import { resumeTemplates } from '@/json/resumeTemplates';
import { configStore, moduleActiveStore } from '@/mobx';
import {
  TemplateFirstPagePreview,
  TEMPLATE_CARD_PREVIEW_SCALE,
} from '../components/panel/components/resumeTemplate';

function MobileTemplateOverlay({ onClose }: { onClose: () => void }) {
  const { confirm } = useResponsiveConfirm();
  const tm = useTranslations('Edit.mobile');
  const tr = useTranslations('Edit.resumeTemplate');
  const cards = useMemo(
    () =>
      resumeTemplates.map((template, index) => ({
        ...template,
        orderLabel: tr('orderLabel', { n: String(index + 1).padStart(2, '0') }),
      })),
    [tr],
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const applyTemplate = (tpl: (typeof resumeTemplates)[number]) => {
    configStore.setConfig(JSON.parse(JSON.stringify(tpl.config)));
    moduleActiveStore.setModuleActive('global');
    message.success(tr('appliedOk'));
    onClose();
  };
  const onPick = (tpl: (typeof resumeTemplates)[number]) => {
    confirm({
      title: tr('replaceTitle'),
      content: (
        <div className='space-y-2 text-left'>
          <p className='text-[13px] leading-relaxed text-[var(--adm-color-text-secondary)]'>
            {tr('replaceBody')}
          </p>
          <span className='inline-flex rounded-full border border-fg/[0.08] bg-fg/[0.05] px-2.5 py-1 text-[11px] font-medium text-fg/58'>
            {tr('replaceRecommend')}
          </span>
        </div>
      ),
      okText: tr('okReplace'),
      cancelText: tr('cancel'),
      danger: true,
      onOk: () => applyTemplate(tpl),
    });
  };

  return (
    <div className='fixed inset-0 z-[200] flex flex-col bg-[var(--editor-shell-bg)]'>
      <div className='flex shrink-0 items-center justify-between border-b border-fg/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]'>
        <span className='text-sm font-semibold text-fg/90'>{tm('navTemplates')}</span>
        <button
          type='button'
          onClick={onClose}
          aria-label={tm('closeTemplates')}
          className='flex h-9 w-9 items-center justify-center rounded-full border border-fg/14 text-fg/70'
        >
          <CloseOutlined />
        </button>
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4'>
        <ul className='grid grid-cols-2 gap-3'>
          {cards.map((t) => (
            <li key={t.id} className='min-w-0'>
              <button
                type='button'
                onClick={() => onPick(t)}
                className='flex w-full flex-col overflow-hidden rounded-2xl border border-fg/10 bg-fg/[0.03] text-left'
              >
                <div className='border-b border-fg/8 px-2 py-1.5'>
                  <span className='block truncate text-[11px] font-semibold text-fg/88'>{t.title}</span>
                  <span className='text-[10px] text-fg/45'>{t.orderLabel}</span>
                </div>
                <div className='flex justify-center overflow-hidden bg-[rgb(var(--surface-fg-rgb)/0.04)] py-2'>
                  <TemplateFirstPagePreview template={t} scale={TEMPLATE_CARD_PREVIEW_SCALE} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default memo(MobileTemplateOverlay);
