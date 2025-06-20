import { memo } from 'react';

import styles from './index.module.less';
import { DeleteOne } from '@icon-park/react';
import { useMemoizedFn } from 'ahooks';
import { moduleActiveStore } from '@/mobx';

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

  return (
    <div
      onClick={clickHandle}
      className={`relative ${props.isActive ? styles.moduleActive : ''}`}
    >
      {props.children}
      <div className='absolute bottom-[-30px] right-[-2px] w-full h-[30px] flex items-center justify-end'>
        <div className='rounded-br-[5px] rounded-bl-[5px] overflow-hidden cursor-pointer'>
          {props.isActive ? (
            <div className='w-[30px] h-[30px] flex items-center justify-center bg-[#179aff]'>
              <DeleteOne
                theme='outline'
                size='17'
                fill='#fff'
                onClick={deleteHandle}
              />
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ModuleOperation);
