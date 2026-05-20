'use client';
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
import { useTranslations } from 'next-intl';
import { Input, Popover, Space } from 'antd';
import { useAppMessage } from '@/hooks/useAppMessage';
import { responsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { useMobileEdit } from '@/views/edit/mobile/context';
import { observer } from 'mobx-react';
import {
  memo,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
} from 'react';
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
  dragSortAria,
}: {
  listeners: ReturnType<typeof useSortable>['listeners'];
  attributes: ReturnType<typeof useSortable>['attributes'];
  setActivatorNodeRef: ReturnType<typeof useSortable>['setActivatorNodeRef'];
  dragSortAria: string;
}) {
  return (
    <button
      type='button'
      ref={setActivatorNodeRef}
      {...listeners}
      {...attributes}
      className='flex w-4 shrink-0 cursor-grab flex-col gap-[3px] rounded border-0 bg-transparent p-0 text-fg/45 outline-none hover:text-fg/60 active:cursor-grabbing'
      aria-label={dragSortAria}
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
  editingId,
  editDraft,
  setEditDraft,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  ignoreEditBlur,
  onDelete,
  dragSortAria,
  editNameAria,
  deleteAria,
}: {
  mod: ModuleRow;
  editingId: string | null;
  editDraft: string;
  setEditDraft: (v: string) => void;
  onBeginEdit: (id: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  ignoreEditBlur: MutableRefObject<boolean>;
  onDelete: (id: string) => void;
  dragSortAria: string;
  editNameAria: string;
  deleteAria: string;
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
      'transform 200ms cubic-bezier(0.25, 1, 0.5, 1), opacity 160ms ease',
    touchAction: 'none',
    zIndex: isDragging ? 3 : undefined,
    position: 'relative',
    opacity: isDragging ? 0.96 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex origin-center items-center gap-2 rounded-lg bg-fg/[0.06] px-[15px] py-[5px] text-[13px] text-fg/90 will-change-transform'
    >
      <DragHandle
        listeners={listeners}
        attributes={attributes}
        setActivatorNodeRef={setActivatorNodeRef}
        dragSortAria={dragSortAria}
      />
      {editingId === mod.id ? (
        <Input
          autoFocus
          value={editDraft}
          onChange={(e) => setEditDraft(e.target.value)}
          onBlur={() => {
            if (ignoreEditBlur.current) return;
            onCommitEdit();
          }}
          onPressEnter={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onCancelEdit();
            }
          }}
          onFocus={(e) => e.target.select()}
          maxLength={64}
          className='min-w-0 flex-1'
          styles={{
            input: {
              backgroundColor: 'var(--antd-input-bg)',
              color: 'var(--antd-input-fg)',
              border: '1px solid var(--antd-input-border)',
              borderRadius: 6,
              paddingInline: 8,
              height: 26,
              fontSize: 13,
            },
          }}
        />
      ) : (
        <span className='min-w-0 flex-1 truncate'>{displayName(mod)}</span>
      )}
      <Space size={4} className='shrink-0'>
        <button
          type='button'
          className='rounded p-1 text-fg/45 transition-colors hover:bg-fg/[0.08] hover:text-fg cursor-pointer'
          aria-label={editNameAria}
          onClick={(e) => {
            e.stopPropagation();
            onBeginEdit(mod.id);
          }}
        >
          <EditOutlined className='text-[14px]' />
        </button>
        <button
          type='button'
          className='rounded p-1 text-fg/45 transition-colors hover:bg-fg/[0.08] hover:text-red-400 cursor-pointer'
          aria-label={deleteAria}
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
  editingId,
  editDraft,
  setEditDraft,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  ignoreEditBlur,
  onDelete,
  dragSortAria,
  editNameAria,
  deleteAria,
}: {
  modules: ModuleRow[];
  onReorder: (next: ModuleRow[]) => void;
  editingId: string | null;
  editDraft: string;
  setEditDraft: (v: string) => void;
  onBeginEdit: (id: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  ignoreEditBlur: MutableRefObject<boolean>;
  onDelete: (id: string) => void;
  dragSortAria: string;
  editNameAria: string;
  deleteAria: string;
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
              editingId={editingId}
              editDraft={editDraft}
              setEditDraft={setEditDraft}
              onBeginEdit={onBeginEdit}
              onCommitEdit={onCommitEdit}
              onCancelEdit={onCancelEdit}
              ignoreEditBlur={ignoreEditBlur}
              onDelete={onDelete}
              dragSortAria={dragSortAria}
              editNameAria={editNameAria}
              deleteAria={deleteAria}
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
  const message = useAppMessage();
  const t = useTranslations('Edit.moduleManage');
  const th = useTranslations('Edit.header');
  const mobile = useMobileEdit();
  const [popOpen, setPopOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const ignoreEditBlur = useRef(false);
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

  const beginInlineEdit = useMemoizedFn((id: string) => {
    const mod = modules.find((m) => m.id === id);
    ignoreEditBlur.current = true;
    setEditDraft(mod ? displayName(mod) : '');
    setEditId(id);
    queueMicrotask(() => {
      ignoreEditBlur.current = false;
    });
  });

  const commitEdit = useMemoizedFn(() => {
    if (!editId) return;
    const title = editDraft.trim();
    if (!title) {
      message.warning(t('enterModuleNameWarn'));
      setEditId(null);
      return;
    }
    updateModuleTitleInConfig(editId, title);
    setEditId(null);
    message.success(t('updated'));
  });

  const cancelEdit = useMemoizedFn(() => {
    setEditId(null);
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
    responsiveConfirm(mobile, {
      title: t('deleteModuleTitle'),
      content: t('deleteModuleContent', { name }),
      okText: t('deleteOk'),
      cancelText: t('cancel'),
      danger: true,
      zIndex: 1100,
      onOk: () => {
        removeModuleFromConfig(id);
        message.success(t('deleted'));
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
        <div className='px-3 py-6 text-center text-[13px] text-fg/45'>
          {t('empty')}
        </div>
      ) : (
        <SortableModuleList
          modules={modules}
          onReorder={reorder}
          editingId={editId}
          editDraft={editDraft}
          setEditDraft={setEditDraft}
          onBeginEdit={beginInlineEdit}
          onCommitEdit={commitEdit}
          onCancelEdit={cancelEdit}
          ignoreEditBlur={ignoreEditBlur}
          onDelete={confirmDelete}
          dragSortAria={t('dragSortAria')}
          editNameAria={t('editNameAria')}
          deleteAria={t('deleteAria')}
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
              background: 'var(--antd-popup-panel)',
              borderRadius: 10,
            },
          }}
          arrow={false}
          content={list}
        >
          <button
            type='button'
            className='flex h-[30px] cursor-pointer items-center gap-1.5 rounded-full border border-fg/15 bg-fg/[0.06] px-3.5 text-[13px] font-medium text-fg/95 transition-colors hover:bg-fg/10'
          >
            <span>{th('moduleManage')}</span>
            <RightOutlined
              className={`text-[10px] text-fg/70 transition-transform duration-200 ${
                popOpen ? 'rotate-90' : ''
              }`}
            />
          </button>
        </Popover>
      )}

    </>
  );
}

export default memo(observer(ModuleManageInner));
