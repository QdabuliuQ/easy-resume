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

  return { clickModule, getModule };
}
