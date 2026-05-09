import { DeleteOutlined, DownOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useMemoizedFn } from 'ahooks';
import { memo, type MouseEvent } from 'react';
import { observer } from 'mobx-react';
import { useModuleHandle } from '@/hooks/module';
import { moduleActiveStore } from '@/mobx';

function PanelToolbar({ moduleId }: { moduleId: string }) {
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
      title: '删除模块',
      content: '确定删除该模块吗？删除后不可恢复。',
      okText: '删除',
      cancelText: '取消',
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
          aria-label='删除模块'
        >
          <DeleteOutlined className='text-[15px]' />
        </button>
        <button
          type='button'
          className='panel-toolbar-btn border-0 p-0'
          onClick={toggleEdit}
          aria-expanded={editOpen}
          aria-label={editOpen ? '切换为预览' : '切换为编辑'}
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
