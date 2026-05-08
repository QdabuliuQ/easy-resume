'use client';
import { AppstoreOutlined } from '@ant-design/icons';
import { Modal, message } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { memo } from 'react';
import { resumeTemplates } from '@/json/resumeTemplates';
import { configStore, moduleActiveStore } from '@/mobx';

function ResumeTemplate() {
  const [modal, contextHolder] = Modal.useModal();

  const onPick = useMemoizedFn((tpl: (typeof resumeTemplates)[number]) => {
    modal.confirm({
      title: (
        <span className='text-[15px] font-semibold !text-white/95'>
          替换当前简历？
        </span>
      ),
      content: (
        <span className='block text-[13px] leading-relaxed !text-white/70'>
          将用所选模板覆盖当前编辑内容，此操作不可撤销。
        </span>
      ),
      okText: '确定替换',
      cancelText: '取消',
      centered: true,
      okButtonProps: { danger: true },
      wrapClassName:
        '[&_.ant-modal-confirm-title]:!text-white/95 [&_.ant-modal-confirm-content]:!text-white/70',
      styles: {
        content: { background: '#323236', padding: 20 },
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
      <header className='flex shrink-0 items-center justify-center gap-2 py-[7px] text-center'>
        <AppstoreOutlined className='text-[22px] shrink-0 [&_svg]:!fill-[var(--color-primary)]' />
        <h1 className='bg-gradient-primary bg-clip-text text-[18px] font-bold leading-tight text-transparent'>
          简历模板
        </h1>
      </header>
      <p className='text-[11px] leading-relaxed text-white/45'>
        点击下方模板应用完整示例配置；应用前请确认已备份当前简历（可导出 JSON）。
      </p>
      <ul className='grid grid-cols-2 gap-2'>
        {resumeTemplates.map((t) => (
          <li key={t.id} className='min-w-0'>
            <button
              type='button'
              onClick={() => onPick(t)}
              className='group flex w-full min-h-[56px] cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-2 text-center transition-colors hover:border-[color:var(--color-primary)] hover:bg-white/[0.06]'
            >
              <span className='line-clamp-2 text-[14px] font-medium leading-snug text-white/90 transition-colors group-hover:text-[color:var(--color-primary)]'>
                {t.title}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
    </>
  );
}

export default memo(ResumeTemplate);
