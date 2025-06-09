import { memo, MemoExoticComponent } from 'react';
import Info1 from './components/info1';
import Global from './components/global';
import { observer } from 'mobx-react';
import { moduleActiveStore } from '@/mobx';
import { useMemoizedFn } from 'ahooks';
import { getModuleInfo } from '@/utils';
import { configStore } from '@/mobx';

const PanelMapped: { [key: string]: MemoExoticComponent<any> } = {
  info1: Info1,
};

function Panel() {
  const PanelRender = useMemoizedFn((): any => {
    const moduleActive = moduleActiveStore.getModuleActive;
    const config = configStore.getConfig;
    if (!config || !moduleActive) {
      return <Global />;
    }
    const moduleInfo = getModuleInfo(config.pages, moduleActive);
    return PanelMapped[moduleInfo.type] ?? <Global />;
  });

  return (
    <div className='min-w-[400px] bg-white mr-[20px] rounded-md text-black'>
      <div className='p-[20px]'>{PanelRender()}</div>
    </div>
  );
}

export default memo(observer(Panel));
