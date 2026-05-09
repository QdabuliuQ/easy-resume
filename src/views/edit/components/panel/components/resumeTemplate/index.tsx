'use client';
import { AppstoreOutlined } from '@ant-design/icons';
import { Modal, message } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { memo, useMemo } from 'react';
import { resumeTemplates } from '@/json/resumeTemplates';
import { configStore, moduleActiveStore } from '@/mobx';

const panelShellClass =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)] shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-md)]';

function ResumeTemplate() {
  const [modal, contextHolder] = Modal.useModal();
  const templateCards = useMemo(
    () =>
      resumeTemplates.map((template, index) => {
        const pageCount = template.config.pages.length;
        const moduleCount = template.config.pages.reduce(
          (total, page) => total + page.modules.length,
          0
        );

        return {
          ...template,
          orderLabel: `${String(index + 1).padStart(2, '0')} 号模板`,
          pageCount,
          moduleCount,
        };
      }),
    []
  );

  const onPick = useMemoizedFn((tpl: (typeof resumeTemplates)[number]) => {
    modal.confirm({
      icon: null,
      title: (
        <div className='flex items-center gap-2 text-[15px] font-semibold !text-fg/95'>
          <span className='flex h-8 w-8 items-center justify-center rounded-xl border border-fg/[0.08] bg-surface/[0.05]'>
            <AppstoreOutlined className='text-[15px] [&_svg]:!fill-[var(--color-primary)]' />
          </span>
          <span>替换当前简历？</span>
        </div>
      ),
      content: (
        <div className='space-y-2'>
          <span className='block text-[13px] leading-relaxed !text-fg/70'>
            将用所选模板覆盖当前编辑内容，此操作不可撤销。
          </span>
          <span className='inline-flex rounded-full border border-fg/[0.08] bg-surface/[0.05] px-2.5 py-1 text-[11px] font-medium text-fg/58'>
            推荐先导出 JSON 备份当前简历
          </span>
        </div>
      ),
      okText: '确定替换',
      cancelText: '取消',
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
      onOk: () => {
        configStore.setConfig(JSON.parse(JSON.stringify(tpl.config)));
        moduleActiveStore.setModuleActive('global');
        message.success('已应用模板');
      },
    });
  });

  return (
    <>
      {contextHolder}
      <div className='relative flex h-full min-h-0 flex-col gap-3 overflow-auto px-0.5 pt-0.5 text-left'>
        <div className={`${panelShellClass} shrink-0 px-4 py-3`}>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div className='flex min-w-0 flex-wrap items-center gap-2'>
              <span className='inline-flex items-center rounded-full border border-fg/[0.08] bg-surface/[0.045] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-fg/58'>
                模板库
              </span>
              <span className='inline-flex items-center rounded-full border border-[color:color-mix(in_srgb,var(--color-primary)_26%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--color-primary)]'>
                共 {templateCards.length} 套
              </span>
            </div>
            <span className='text-[11px] leading-relaxed text-fg/62'>
              直接选择模板即可替换当前配置
            </span>
          </div>
        </div>

        <section className={`${panelShellClass} shrink-0 px-4 py-4`}>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <p className='text-[12px] uppercase tracking-[0.16em] text-fg/58'>使用说明</p>
              <p className='mt-1 text-[13px] leading-relaxed text-fg/72'>
                选择模板后会覆盖当前内容，适合在开始新简历或重构现有排版时使用。
              </p>
            </div>
            <span className='shrink-0 rounded-full border border-fg/[0.08] bg-surface/[0.04] px-2.5 py-1 text-[11px] font-medium text-fg/62'>
              建议先备份
            </span>
          </div>
          <div className='mt-3 rounded-2xl border border-fg/[0.07] bg-[var(--panel-inset-bg)] px-3 py-2.5'>
            <p className='text-[11px] leading-relaxed text-fg/58'>
              应用模板前可先导出 JSON，避免覆盖后无法恢复原始内容。
            </p>
          </div>
        </section>

        <ul className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
        {templateCards.map((t) => (
          <li key={t.id} className='min-w-0'>
            <button
              type='button'
              onClick={() => onPick(t)}
              className='group flex min-h-[138px] w-full cursor-pointer flex-col items-start justify-between rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.055)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),var(--panel-layer-deep)] px-3.5 py-3.5 text-left shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-card-tight)] transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--color-primary)_42%,rgb(var(--panel-surface-rgb)/0.12))] hover:bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.07)_0%,rgb(var(--panel-surface-rgb)/0.03)_100%),var(--panel-layer-deep)] hover:shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.05),var(--panel-shadow-hover-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]'
            >
              <div className='w-full'>
                <div className='flex items-center justify-between gap-3'>
                  <span className='inline-flex items-center whitespace-nowrap rounded-full border border-fg/[0.08] bg-surface/[0.04] px-2.5 py-1 text-[11px] font-medium text-fg/62'>
                    {t.orderLabel}
                  </span>
                  <span className='shrink-0 whitespace-nowrap text-[11px] text-fg/58'>点击应用</span>
                </div>
                <span className='mt-3 block text-[15px] font-semibold leading-snug text-fg/92 transition-colors group-hover:text-fg'>
                  {t.title}
                </span>
                <p className='mt-2 text-[12px] leading-relaxed text-fg/58'>
                  {t.pageCount} 页结构，包含 {t.moduleCount} 个模块，可直接作为完整示例起点。
                </p>
              </div>
              <div className='mt-4 flex w-full items-center justify-between gap-3 border-t border-fg/[0.06] pt-4'>
                <div className='flex flex-wrap gap-1.5'>
                  <span className='inline-flex items-center whitespace-nowrap rounded-full border border-fg/[0.08] bg-surface/[0.04] px-2 py-0.5 text-[11px] text-fg/62'>
                    {t.pageCount} 页
                  </span>
                  <span className='inline-flex items-center whitespace-nowrap rounded-full border border-fg/[0.08] bg-surface/[0.04] px-2 py-0.5 text-[11px] text-fg/62'>
                    {t.moduleCount} 模块
                  </span>
                </div>
                <span className='inline-flex shrink-0 items-center whitespace-nowrap rounded-xl border border-[color:color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-2.5 py-1 text-[12px] font-medium text-[color:var(--color-primary)] transition-colors group-hover:border-[color:color-mix(in_srgb,var(--color-primary)_38%,transparent)] group-hover:bg-[color:color-mix(in_srgb,var(--color-primary)_18%,transparent)]'>
                  应用模板
                </span>
              </div>
            </button>
          </li>
        ))}
        </ul>
      </div>
    </>
  );
}

export default memo(ResumeTemplate);
