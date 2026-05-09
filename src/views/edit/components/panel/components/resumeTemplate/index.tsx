'use client';
import { AppstoreOutlined } from '@ant-design/icons';
import { Modal, message } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { memo, useMemo } from 'react';
import { resumeTemplates } from '@/json/resumeTemplates';
import { configStore, moduleActiveStore } from '@/mobx';

const panelShellClass =
  'overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.025)_100%),rgba(255,255,255,0.03)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_34px_rgba(0,0,0,0.12)]';

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
        <div className='flex items-center gap-2 text-[15px] font-semibold !text-white/95'>
          <span className='flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05]'>
            <AppstoreOutlined className='text-[15px] [&_svg]:!fill-[var(--color-primary)]' />
          </span>
          <span>替换当前简历？</span>
        </div>
      ),
      content: (
        <div className='space-y-2'>
          <span className='block text-[13px] leading-relaxed !text-white/70'>
            将用所选模板覆盖当前编辑内容，此操作不可撤销。
          </span>
          <span className='inline-flex rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-white/58'>
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
          '!rounded-xl !border-white/[0.08] !bg-white/[0.04] !text-white/72 hover:!border-white/[0.14] hover:!bg-white/[0.08]',
      },
      wrapClassName:
        '[&_.ant-modal-confirm-title]:!text-white/95 [&_.ant-modal-confirm-content]:!text-white/70',
      styles: {
        content: {
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%), rgba(40,35,43,0.96)',
          padding: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        },
        header: { background: 'transparent' },
        body: { background: 'transparent' },
        footer: { background: 'transparent' },
      },
      classNames: {
        content: '!bg-[#323236]',
        mask: '!bg-black/55',
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
              <span className='inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.045] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/48'>
                模板库
              </span>
              <span className='inline-flex items-center rounded-full border border-[color:color-mix(in_srgb,var(--color-primary)_26%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--color-primary)]'>
                共 {templateCards.length} 套
              </span>
            </div>
            <span className='text-[11px] leading-relaxed text-white/42'>
              直接选择模板即可替换当前配置
            </span>
          </div>
        </div>

        <section className={`${panelShellClass} shrink-0 px-4 py-4`}>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <p className='text-[12px] uppercase tracking-[0.16em] text-white/38'>使用说明</p>
              <p className='mt-1 text-[13px] leading-relaxed text-white/72'>
                选择模板后会覆盖当前内容，适合在开始新简历或重构现有排版时使用。
              </p>
            </div>
            <span className='shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/52'>
              建议先备份
            </span>
          </div>
          <div className='mt-3 rounded-2xl border border-white/[0.07] bg-black/10 px-3 py-2.5'>
            <p className='text-[11px] leading-relaxed text-white/48'>
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
              className='group flex min-h-[138px] w-full cursor-pointer flex-col items-start justify-between rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.055)_0%,rgba(255,255,255,0.025)_100%),rgba(0,0,0,0.08)] px-3.5 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_16px_34px_rgba(0,0,0,0.10)] transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--color-primary)_42%,white_12%)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.03)_100%),rgba(0,0,0,0.08)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_38px_rgba(0,0,0,0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-primary)]'
            >
              <div className='w-full'>
                <div className='flex items-center justify-between gap-3'>
                  <span className='inline-flex items-center whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/52'>
                    {t.orderLabel}
                  </span>
                  <span className='shrink-0 whitespace-nowrap text-[11px] text-white/35'>点击应用</span>
                </div>
                <span className='mt-3 block text-[15px] font-semibold leading-snug text-white/92 transition-colors group-hover:text-white'>
                  {t.title}
                </span>
                <p className='mt-2 text-[12px] leading-relaxed text-white/46'>
                  {t.pageCount} 页结构，包含 {t.moduleCount} 个模块，可直接作为完整示例起点。
                </p>
              </div>
              <div className='mt-4 flex w-full items-center justify-between gap-3 border-t border-white/[0.06] pt-4'>
                <div className='flex flex-wrap gap-1.5'>
                  <span className='inline-flex items-center whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/52'>
                    {t.pageCount} 页
                  </span>
                  <span className='inline-flex items-center whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/52'>
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
