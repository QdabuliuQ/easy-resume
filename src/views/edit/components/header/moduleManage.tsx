import { EditOutlined, RightOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMemoizedFn } from 'ahooks';
import { Modal, Input, Popover, Space, message } from 'antd';
import { observer } from 'mobx-react';
import { memo, useMemo, useState, type CSSProperties } from 'react';
import { configStore } from '@/mobx';
import { useModuleHandle } from '@/hooks/module';
import { moduleType } from '@/modules/utils/constant';

type ModuleRow = {
  id: string;
  type: string;
  options?: { title?: string };
};

function displayName(mod: ModuleRow) {
  const t = mod.options?.title;
  if (t != null && String(t).trim() !== '') return String(t).trim();
  return (
    (moduleType as Record<string, { name: string }>)[mod.type]?.name ?? mod.type
  );
}

function DragHandle({
  listeners,
  attributes,
  setActivatorNodeRef,
}: {
  listeners: ReturnType<typeof useSortable>['listeners'];
  attributes: ReturnType<typeof useSortable>['attributes'];
  setActivatorNodeRef: ReturnType<typeof useSortable>['setActivatorNodeRef'];
}) {
  return (
    <button
      type='button'
      ref={setActivatorNodeRef}
      {...listeners}
      {...attributes}
      className='flex w-4 shrink-0 cursor-grab flex-col gap-[3px] rounded border-0 bg-transparent p-0 text-white/45 outline-none hover:text-white/60 active:cursor-grabbing'
      aria-label='拖拽排序'
      onClick={(e) => e.stopPropagation()}
    >
      <span className='h-0.5 rounded-sm bg-current' />
      <span className='h-0.5 rounded-sm bg-current' />
      <span className='h-0.5 rounded-sm bg-current' />
    </button>
  );
}

function SortableModuleRow({
  mod,
  onEdit,
  onDelete,
}: {
  mod: ModuleRow;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id });

  const style: CSSProperties = {
    transform: transform
      ? `${CSS.Transform.toString(transform)}${isDragging ? ' scale(1.02)' : ''}`
      : undefined,
    transition:
      transition ??
      'transform 200ms cubic-bezier(0.25, 1, 0.5, 1), box-shadow 180ms ease, opacity 160ms ease',
    touchAction: 'none',
    zIndex: isDragging ? 3 : undefined,
    position: 'relative',
    opacity: isDragging ? 0.96 : undefined,
    boxShadow: isDragging
      ? '0 14px 40px rgba(0, 0, 0, 0.42), 0 0 0 1px rgba(255,255,255,0.12)'
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex origin-center items-center gap-2 rounded-lg bg-white/[0.06] px-[15px] py-[5px] text-[13px] text-white/90 will-change-transform'
    >
      <DragHandle
        listeners={listeners}
        attributes={attributes}
        setActivatorNodeRef={setActivatorNodeRef}
      />
      <span className='min-w-0 flex-1 truncate'>{displayName(mod)}</span>
      <Space size={4} className='shrink-0'>
        <button
          type='button'
          className='rounded p-1 text-white/45 transition-colors hover:bg-white/[0.08] hover:text-white cursor-pointer'
          aria-label='编辑名称'
          onClick={(e) => {
            e.stopPropagation();
            onEdit(mod.id);
          }}
        >
          <EditOutlined className='text-[14px]' />
        </button>
        <button
          type='button'
          className='rounded p-1 text-white/45 transition-colors hover:bg-white/[0.08] hover:text-red-400 cursor-pointer'
          aria-label='删除'
          onClick={(e) => {
            e.stopPropagation();
            onDelete(mod.id);
          }}
        >
          <DeleteOutlined className='text-[14px]' />
        </button>
      </Space>
    </div>
  );
}

function SortableModuleList({
  modules,
  onReorder,
  onEdit,
  onDelete,
}: {
  modules: ModuleRow[];
  onReorder: (next: ModuleRow[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const ids = useMemo(() => modules.map((m) => m.id), [modules]);

  const onDragEnd = useMemoizedFn((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(modules, oldIndex, newIndex));
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className='flex flex-col gap-2 py-1'>
          {modules.map((mod) => (
            <SortableModuleRow
              key={mod.id}
              mod={mod}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function ModuleManageInner({
  inline = false,
  className,
}: {
  inline?: boolean;
  className?: string;
}) {
  const [popOpen, setPopOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const {
    removeModuleFromConfig,
    reorderFlattenedModules,
    updateModuleTitleInConfig,
  } = useModuleHandle();

  const modules = useMemo((): ModuleRow[] => {
    const cfg = configStore.getConfig;
    if (!cfg?.pages?.length) return [];
    return cfg.pages.flatMap((p: { modules: ModuleRow[] }) => p.modules ?? []);
  }, [configStore.getConfig]);

  const reorder = useMemoizedFn((next: ModuleRow[]) => {
    reorderFlattenedModules(next);
  });

  const openEdit = useMemoizedFn((id: string) => {
    const mod = modules.find((m) => m.id === id);
    setEditDraft(mod ? displayName(mod) : '');
    setPopOpen(false);
    setEditId(id);
  });

  const confirmEdit = useMemoizedFn(() => {
    if (!editId) return;
    const t = editDraft.trim();
    if (!t) {
      message.warning('请输入模块名称');
      return;
    }
    updateModuleTitleInConfig(editId, t);
    setEditId(null);
    message.success('已更新');
  });

  const confirmDelete = useMemoizedFn((id: string) => {
    setPopOpen(false);
    const name = displayName(
      modules.find((m) => m.id === id) ??
        ({
          type: '',
          options: {},
        } as ModuleRow)
    );
    Modal.confirm({
      title: '删除模块',
      content: `确定删除模块「${name}」吗？此操作不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      zIndex: 1100,
      onOk: () => {
        removeModuleFromConfig(id);
        message.success('已删除');
      },
    });
  });

  const list = (
    <div
      className={`max-h-[min(380px,calc(100vh-160px))] overflow-x-hidden overflow-y-auto ${
        inline ? 'w-full min-w-0' : 'w-[272px]'
      }`}
    >
      {modules.length === 0 ? (
        <div className='px-3 py-6 text-center text-[13px] text-white/45'>
          暂无模块
        </div>
      ) : (
        <SortableModuleList
          modules={modules}
          onReorder={reorder}
          onEdit={openEdit}
          onDelete={confirmDelete}
        />
      )}
    </div>
  );

  return (
    <>
      {inline ? (
        <div className={className}>{list}</div>
      ) : (
        <Popover
          open={popOpen}
          onOpenChange={setPopOpen}
          placement='bottomRight'
          trigger='click'
          styles={{
            root: { zIndex: 1050 },
            body: {
              padding: 10,
              background: '#2e2d31',
              borderRadius: 10,
            },
          }}
          arrow={false}
          content={list}
        >
          <button
            type='button'
            className='flex h-[30px] cursor-pointer items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 text-[13px] font-medium text-white/95 transition-colors hover:bg-white/10'
          >
            <span>模块管理</span>
            <RightOutlined
              className={`text-[10px] text-white/70 transition-transform duration-200 ${
                popOpen ? 'rotate-90' : ''
              }`}
            />
          </button>
        </Popover>
      )}

      <Modal
        title='编辑模块名称'
        open={Boolean(editId)}
        okText='确定'
        cancelText='取消'
        destroyOnHidden
        onCancel={() => setEditId(null)}
        onOk={confirmEdit}
        centered
        zIndex={1100}
      >
        <Input
          placeholder='请输入模块名称'
          value={editDraft}
          onChange={(e) => setEditDraft(e.target.value)}
          maxLength={64}
          onPressEnter={confirmEdit}
        />
      </Modal>
    </>
  );
}

export default memo(observer(ModuleManageInner));
