import { memo, MemoExoticComponent, useMemo } from 'react';
import Info1 from './components/info1';
import Global from './components/global';
import { observer } from 'mobx-react';
import { useMemoizedFn } from 'ahooks';
import { getModuleInfo } from '@/utils';
import { configStore, moduleActiveStore } from '@/mobx';
import { Tabs } from 'antd';
import { moduleType } from '@/modules/utils/constant';

function Panel() {
  const PanelMapped: { [key: string]: MemoExoticComponent<any> } = useMemo(
    () => ({
      info1: Info1,
    }),
    []
  );

  const PanelRender = useMemoizedFn((): any => {
    const moduleActive = moduleActiveStore.getModuleActive;
    const config = configStore.getConfig;
    if (!config || !moduleActive) {
      return <Global />;
    }
    const moduleInfo = getModuleInfo(config.pages, moduleActive);
    console.log(
      PanelMapped,
      moduleInfo,
      'moduleInfo',
      moduleInfo ? PanelMapped[moduleInfo.type] : null
    );
    const PanelComponent = moduleInfo ? PanelMapped[moduleInfo.type] : null;
    return PanelComponent ? <PanelComponent /> : <Global />;
  });

  const getTabItems = useMemoizedFn(() => {
    const config = configStore.getConfig;
    if (!config) {
      return <></>;
    }
    const { pages } = config;
    const modules = [<Tabs.TabPane tab='全局配置' key='global'></Tabs.TabPane>];
    if (pages.length) {
      for (const item of pages) {
        for (const module of item.modules) {
          modules.push(
            <Tabs.TabPane
              tab={(moduleType as any)[module.type].name}
              key={module.id}
            ></Tabs.TabPane>
          );
        }
      }
    }
    return modules;
  });

  getTabItems();

  const tabChange = useMemoizedFn((key: string) => {
    console.log(key, 'key');
    moduleActiveStore.setModuleActive(key);
  });

  return (
    <div className='min-w-[500px] max-w-[500px] w-[500px] bg-white mr-[20px] rounded-md text-black !h-[calc(100vh-100px)]'>
      <div className='w-[100%] flex justify-end'>
        <Tabs
          activeKey={moduleActiveStore.getModuleActive}
          style={{ width: '95%', height: '42px' }}
          onChange={tabChange}
        >
          {getTabItems()}
        </Tabs>
      </div>
      <div className='h-[calc(100%-42px)] overflow-auto'>
        <div className='p-[20px]'>{PanelRender()}</div>
      </div>
    </div>
  );
}

export default memo(observer(Panel));
