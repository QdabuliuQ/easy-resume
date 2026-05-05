import { configStore, moduleActiveStore } from '@/mobx';
import { useMemoizedFn } from 'ahooks';
import {
  createEmptyResumeModule,
  type ResumeModuleType,
} from '@/utils/createResumeModule';

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

  const removeModuleFromConfig = useMemoizedFn((id: string) => {
    const config = configStore.getConfig;
    if (!id || !config) return;
    for (let i = 0; i < config.pages.length; i++) {
      for (let j = 0; j < config.pages[i].modules.length; j++) {
        if (config.pages[i].modules[j].id === id) {
          config.pages[i].modules.splice(j, 1);
          moduleActiveStore.setModuleActive('global');
          configStore.setConfig({
            ...config,
            pages: [...config.pages],
          });
          return;
        }
      }
    }
  });

  /** 扁平顺序重排：合并到第一页 modules，其余页 modules 清空 */
  const reorderFlattenedModules = useMemoizedFn((ordered: unknown[]) => {
    const config = configStore.getConfig;
    if (!config?.pages?.length) return;
    const snapshot = ordered.map((m) => JSON.parse(JSON.stringify(m)));
    const first = { modules: snapshot };
    const rest = config.pages.slice(1).map(() => ({ modules: [] }));
    configStore.setConfig({
      ...config,
      pages: [first, ...rest],
    });
  });

  const addModuleByType = useMemoizedFn((type: ResumeModuleType) => {
    const config = configStore.getConfig;
    if (!config) return;
    const mod = createEmptyResumeModule(type);
    if (!config.pages?.length) {
      const next = JSON.parse(JSON.stringify(config));
      next.pages = [{ modules: [mod] }];
      configStore.setConfig(next);
      moduleActiveStore.setModuleActive(mod.id);
      return;
    }
    const next = JSON.parse(JSON.stringify(config));
    next.pages[0].modules.push(mod);
    configStore.setConfig(next);
    moduleActiveStore.setModuleActive(mod.id);
  });

  const updateModuleTitleInConfig = useMemoizedFn((id: string, title: string) => {
    const cfg = configStore.getConfig;
    if (!cfg) return;
    const next = JSON.parse(JSON.stringify(cfg));
    for (const page of next.pages as Array<{ modules: Array<{ id: string; options?: Record<string, unknown> }> }>) {
      for (const mod of page.modules) {
        if (mod.id === id) {
          mod.options = { ...(mod.options ?? {}), title };
          configStore.setConfig(next);
          return;
        }
      }
    }
  });

  return {
    clickModule,
    getModule,
    getModuleIndex,
    addModuleByType,
    removeModuleFromConfig,
    reorderFlattenedModules,
    updateModuleTitleInConfig,
  };
}
