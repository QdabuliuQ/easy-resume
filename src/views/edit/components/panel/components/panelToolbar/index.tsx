'use client';
import { DeleteOutlined } from '@ant-design/icons';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { useMemoizedFn } from 'ahooks';
import { useTranslations } from 'next-intl';
import { memo, type MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { useModuleHandle } from '@/hooks/module';

function PanelToolbar({ moduleId }: { moduleId: string }) {
  const tp = useTranslations('Edit.panelToolbar');
  const { removeModuleFromConfig } = useModuleHandle();
  const { confirm, contextHolder } = useResponsiveConfirm();

  const onDelete = useMemoizedFn((e: MouseEvent) => {
    e.stopPropagation();
    confirm({
      title: tp('deleteModuleTitle'),
      content: tp('deleteModuleContent'),
      okText: tp('deleteOk'),
      cancelText: tp('cancel'),
      danger: true,
      onOk: () => removeModuleFromConfig(moduleId),
    });
  });

  return (
    <>
      {contextHolder}
      <div className='flex shrink-0 items-center gap-3'>
        <button
          type='button'
          className='panel-toolbar-btn panel-toolbar-btn-danger border-0 p-0'
          onClick={onDelete}
          aria-label={tp('deleteModuleAria')}
        >
          <DeleteOutlined className='text-[15px]' />
        </button>
      </div>
    </>
  );
}

export default memo(observer(PanelToolbar));
