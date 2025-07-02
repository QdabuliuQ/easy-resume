import { memo, useEffect, useState } from 'react';

import styles from './index.module.less';
import { ArrowCircleUp, DeleteOne } from '@icon-park/react';
import { useMemoizedFn } from 'ahooks';
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
  const clickHandle = useMemoizedFn(() => {
    if (props.clickModule) {
      props.clickModule(props.id);
    }
    moduleActiveStore.setModuleActive(
      moduleActiveStore.getModuleActive === props.id ? 'global' : props.id
    );
    console.log(moduleActiveStore.getModuleActive, 'moduleActiveStore');
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
  }, [props.id]);

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

  return (
    <div className={`relative ${props.isActive ? styles.moduleActive : ''}`}>
      <div onClick={clickHandle}>{props.children}</div>
      <div className='absolute bottom-[-30px] right-[-2px] w-full h-[30px] flex items-center justify-end z-[100]'>
        <div className='rounded-br-[5px] rounded-bl-[5px] overflow-hidden cursor-pointer'>
          {props.isActive ? (
            <div className='flex items-center'>
              {!isFirst && (
                <div
                  onClick={upHandle}
                  className='box-sizing-border not-last:border-r not-last:border-r-[#ffffffb0] not-last:border-r-[1px] w-[35px] h-[30px] flex items-center justify-center bg-blue-300 hover:bg-blue-400 transition-all'
                >
                  <ArrowCircleUp theme='outline' size='17' fill='#fff' />
                </div>
              )}
              {!isLast && (
                <div
                  onClick={downHandle}
                  className='box-sizing-border not-last:border-r not-last:border-r-[#ffffffb0] not-last:border-r-[1px] w-[35px] h-[30px] flex items-center justify-center bg-blue-300 hover:bg-blue-400 transition-all'
                >
                  <ArrowCircleUp
                    className='rotate-180'
                    theme='outline'
                    size='17'
                    fill='#fff'
                  />
                </div>
              )}
              <div
                onClick={deleteHandle}
                className='box-sizing-border not-last:border-r not-last:border-r-[#ffffffb0] not-last:border-r-[1px] w-[35px] h-[30px] flex items-center justify-center bg-blue-300 hover:bg-blue-400 transition-all'
              >
                <DeleteOne theme='outline' size='17' fill='#fff' />
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(observer(ModuleOperation));
