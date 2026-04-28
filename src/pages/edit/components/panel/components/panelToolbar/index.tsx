import { DeleteOutlined, DownOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useMemoizedFn } from 'ahooks';
import {
  memo,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from 'react';
import { useModuleHandle } from '@/hooks/module';

function PanelToolbar({
  moduleId,
  editOpen,
  setEditOpen,
}: {
  moduleId: string;
  editOpen: boolean;
  setEditOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { removeModuleFromConfig } = useModuleHandle();
  const [modal, contextHolder] = Modal.useModal();

  const onDelete = useMemoizedFn((e: MouseEvent) => {
    e.stopPropagation();
    modal.confirm({
      title: '删除模块',
      content: '确定删除该模块吗？删除后不可恢复。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => removeModuleFromConfig(moduleId),
    });
  });

  return (
    <>
      {contextHolder}
      <div className='flex items-center gap-0.5'>
      <button
        type='button'
        className='flex h-7 w-7 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-white/45 transition-colors hover:text-red-500'
        onClick={onDelete}
        aria-label='删除模块'
      >
        <DeleteOutlined className='text-[15px]' />
      </button>
      <button
        type='button'
        className='flex h-7 w-7 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-white/45 transition-colors hover:text-white/90'
        onClick={() => setEditOpen((v) => !v)}
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

export default memo(PanelToolbar);
