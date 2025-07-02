import { configStore, moduleActiveStore } from '@/mobx';
import { useMemoizedFn } from 'ahooks';

export function useModuleHandle() {
  const clickModule = useMemoizedFn((id: string) => {
    moduleActiveStore.setModuleActive(id);
  });

  const getModule = useMemoizedFn((id: string) => {
    const config = configStore.getConfig;
    if (!config) return;
    for (const page of config.pages) {
      for (const module of page.modules) {
        if (module.id === id) {
          return module;
        }
      }
    }
    return null;
  });

  const getModuleIndex = useMemoizedFn((id: string) => {
    const config = configStore.getConfig;
    if (!config) return;
    for (let i = 0; i < config.pages.length; i++) {
      for (let j = 0; j < config.pages[i].modules.length; j++) {
        if (config.pages[i].modules[j].id === id) {
          return { page: i, module: j };
        }
      }
    }
    return null;
  });

  return { clickModule, getModule, getModuleIndex };
}
