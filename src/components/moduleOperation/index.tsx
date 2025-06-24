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
  children: React.ReactNode;
}) {
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

  return (
    <div
      onClick={clickHandle}
      className={`relative ${props.isActive ? styles.moduleActive : ''}`}
    >
      {props.children}
      <div className='absolute bottom-[-30px] right-[-2px] w-full h-[30px] flex items-center justify-end'>
        <div className='rounded-br-[5px] rounded-bl-[5px] overflow-hidden cursor-pointer'>
          {props.isActive ? (
            <div className='flex items-center'>
              {!isFirst && (
                <div className='box-sizing-border not-last:border-r not-last:border-r-[#ffffffb0] not-last:border-r-[1px] w-[35px] h-[30px] flex items-center justify-center bg-[#179aff]'>
                  <ArrowCircleUp theme='outline' size='17' fill='#fff' />
                </div>
              )}
              {!isLast && (
                <div className='box-sizing-border not-last:border-r not-last:border-r-[#ffffffb0] not-last:border-r-[1px] w-[35px] h-[30px] flex items-center justify-center bg-[#179aff]'>
                  <ArrowCircleUp
                    className='rotate-180'
                    theme='outline'
                    size='17'
                    fill='#fff'
                  />
                </div>
              )}
              <div className='box-sizing-border not-last:border-r not-last:border-r-[#ffffffb0] not-last:border-r-[1px] w-[35px] h-[30px] flex items-center justify-center bg-[#179aff]'>
                <DeleteOne
                  theme='outline'
                  size='17'
                  fill='#fff'
                  onClick={deleteHandle}
                />
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
