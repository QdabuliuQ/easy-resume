import { memo, useEffect, useState } from 'react';

import { ArrowCircleUp, DeleteOne } from '@icon-park/react';
import { useMemoizedFn } from 'ahooks';
import { Modal } from 'antd';
import { configStore, moduleActiveStore } from '@/mobx';
import { observer } from 'mobx-react';

function ModuleOperation(props: {
  id: string;
  isActive: boolean;
  deleteModule?: (id: string) => void;
  clickModule?: (id: string) => void;
  upModule?: (id: string) => void;
  downModule?: (id: string) => void;
  children: React.ReactNode;
}) {
  const [modal, contextHolder] = Modal.useModal();

  const clickHandle = useMemoizedFn(() => {
    if (props.clickModule) {
      props.clickModule(props.id);
    }
    moduleActiveStore.setModuleActive(
      moduleActiveStore.getModuleActive === props.id ? 'global' : props.id
    );
  });

  const deleteHandle = useMemoizedFn(() => {
    if (props.deleteModule) {
      props.deleteModule(props.id);
    }
    moduleActiveStore.setModuleActive('global');
    const config = configStore.getConfig;
    if (!config || !config.pages.length) return;
    for (let i = 0; i < config.pages.length; i++) {
      for (let j = 0; j < config.pages[i].modules.length; j++) {
        const module = config.pages[i].modules[j];
        if (module.id == props.id) {
          config.pages[i].modules.splice(j, 1);
          configStore.setConfig({
            ...config,
            pages: [...config.pages],
          });
          return;
        }
      }
    }
  });

  const [isFirst, setIsFirst] = useState(false);
  const [isLast, setIsLast] = useState(false);

  useEffect(() => {
    const config = configStore.getConfig;
    if (config && config.pages.length > 0) {
      if (config.pages[0].modules.length > 0) {
        const firstModule = config.pages[0].modules[0].id;
        setIsFirst(props.id === firstModule);
      }
      if (config.pages[config.pages.length - 1].modules.length > 1) {
        const lastModule =
          config.pages[config.pages.length - 1].modules[
            config.pages[config.pages.length - 1].modules.length - 1
          ].id;
        setIsLast(props.id === lastModule);
      }
    }
  }, [props.id, configStore.getConfig]);

  const upHandle = useMemoizedFn(() => {
    if (props.upModule) {
      props.upModule(props.id);
    }
    const config = configStore.getConfig;
    if (!config || !config.pages.length) return;
    for (let i = 0; i < config.pages.length; i++) {
      for (let j = 0; j < config.pages[i].modules.length; j++) {
        const module = config.pages[i].modules[j];
        if (module.id == props.id) {
          const temp = config.pages[i].modules[j];
          if (j > 0) {
            config.pages[i].modules[j] = config.pages[i].modules[j - 1];
            config.pages[i].modules[j - 1] = temp;
          } else {
            config.pages[i].modules[j] =
              config.pages[i - 1].modules[
                config.pages[i - 1].modules.length - 1
              ];
            config.pages[i - 1].modules[
              config.pages[i - 1].modules.length - 1
            ] = temp;
          }
          configStore.setConfig({
            ...config,
            pages: [...config.pages],
          });
          return;
        }
      }
    }
  });

  const downHandle = useMemoizedFn(() => {
    if (props.downModule) {
      props.downModule(props.id);
    }
    // 模块向下移动
    const config = configStore.getConfig;
    if (!config || !config.pages.length) return;
    for (let i = 0; i < config.pages.length; i++) {
      for (let j = 0; j < config.pages[i].modules.length; j++) {
        const module = config.pages[i].modules[j];
        if (module.id == props.id) {
          // 如果不是当前页面的最后一个模块，则与下一个模块交换
          if (j < config.pages[i].modules.length - 1) {
            const temp = config.pages[i].modules[j];
            config.pages[i].modules[j] = config.pages[i].modules[j + 1];
            config.pages[i].modules[j + 1] = temp;
          } else if (
            i < config.pages.length - 1 &&
            config.pages[i + 1].modules.length > 0
          ) {
            // 如果是当前页面最后一个模块，且不是最后一页，则与下一页第一个模块交换
            const temp = config.pages[i].modules[j];
            config.pages[i].modules[j] = config.pages[i + 1].modules[0];
            config.pages[i + 1].modules[0] = temp;
          }
          configStore.setConfig({
            ...config,
            pages: [...config.pages],
          });
          return;
        }
      }
    }
  });

  const toolbarLeftPx = -(36 + (configStore.mergedGlobalStyle.padding ?? 0));

  return (
    <>
      {contextHolder}
      <div className='relative flex flex-row items-stretch'>
      {props.isActive ? (
        <div
          style={{ left: `${toolbarLeftPx}px` }}
          className='absolute top-0 z-[100] flex w-9 shrink-0 flex-col overflow-hidden rounded-tl-[6px] rounded-bl-[6px] border-r border-white/35 bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]'
          aria-label='模块操作'
        >
          {!isFirst && (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                upHandle();
              }}
              className='bg-gradient-primary box-border flex h-8 w-9 shrink-0 cursor-pointer items-center justify-center border-b border-white/10 text-white transition-[filter] hover:brightness-110'
              aria-label='上移'
            >
              <ArrowCircleUp theme='outline' size='17' fill='#fff' />
            </button>
          )}
          {!isLast && (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                downHandle();
              }}
              className='bg-gradient-primary box-border flex h-8 w-9 shrink-0 cursor-pointer items-center justify-center border-b border-white/10 text-white transition-[filter] hover:brightness-110'
              aria-label='下移'
            >
              <ArrowCircleUp
                className='rotate-180'
                theme='outline'
                size='17'
                fill='#fff'
              />
            </button>
          )}
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              modal.confirm({
                title: '删除模块',
                content: '确定删除该模块吗？删除后不可恢复。',
                okText: '删除',
                cancelText: '取消',
                okButtonProps: { danger: true },
                centered: true,
                onOk: () => deleteHandle(),
              });
            }}
            className='box-border flex h-8 w-9 shrink-0 cursor-pointer items-center justify-center bg-red-400 text-white hover:bg-red-500'
            aria-label='删除'
          >
            <DeleteOne theme='outline' size='17' fill='#fff' />
          </button>
        </div>
      ) : null}
      <div className='min-w-0 flex-1' onClick={clickHandle}>
        {props.children}
      </div>
    </div>
    </>
  );
}

export default memo(observer(ModuleOperation));
