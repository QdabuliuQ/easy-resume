'use client';
import { DeleteOutlined, DownOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { useTranslations } from 'next-intl';
import { memo, type MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { useModuleHandle } from '@/hooks/module';
import { moduleActiveStore } from '@/mobx';

function PanelToolbar({ moduleId }: { moduleId: string }) {
  const tp = useTranslations('Edit.panelToolbar');
  const { removeModuleFromConfig } = useModuleHandle();
  const [modal, contextHolder] = Modal.useModal();

  const editOpen = moduleActiveStore.getModuleActive === moduleId;

  const toggleEdit = useMemoizedFn(() => {
    if (editOpen) {
      moduleActiveStore.setModuleActive('global');
    } else {
      moduleActiveStore.setModuleActive(moduleId);
    }
  });

  const onDelete = useMemoizedFn((e: MouseEvent) => {
    e.stopPropagation();
    modal.confirm({
      title: tp('deleteModuleTitle'),
      content: tp('deleteModuleContent'),
      okText: tp('deleteOk'),
      cancelText: tp('cancel'),
      okButtonProps: { danger: true },
      centered: true,
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
        <button
          type='button'
          className='panel-toolbar-btn border-0 p-0'
          onClick={toggleEdit}
          aria-expanded={editOpen}
          aria-label={editOpen ? tp('togglePreview') : tp('toggleEdit')}
        >
          <DownOutlined
            className={`text-[15px] transition-transform duration-200 ease-in-out ${
              editOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
    </>
  );
}

export default memo(observer(PanelToolbar));
