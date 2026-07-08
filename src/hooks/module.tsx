'use client';
import { useTranslations } from 'next-intl';
import { useAppMessage } from '@/hooks/useAppMessage';
import { configStore, moduleActiveStore } from '@/mobx';
import { useMemoizedFn } from 'ahooks';
import {
  createEmptyResumeModule,
  type ResumeModuleType,
} from '@/utils/createResumeModule';
import { pinInfo1ModulesFirst } from '@/lib/resumeModuleOrder';
import {
  countResumeModulesByType,
  RESUME_MODULE_MAX_COUNT,
} from '@/utils/moduleTypeLimits';

export function useModuleHandle() {
  const message = useAppMessage();
  const th = useTranslations('Edit.hooks');
  const tr = useTranslations('Edit.resumeContainer');
  const typeLabel = useMemoizedFn((type: ResumeModuleType) => {
    switch (type) {
      case 'info1':
        return tr('tabInfo1');
      case 'certificate':
        return tr('tabCertificate');
      case 'skill':
        return tr('tabSkill');
      case 'job':
        return tr('tabJob');
      case 'project':
        return tr('tabProject');
      case 'education':
        return tr('tabEducation');
      case 'other':
        return tr('tabOther');
      default:
        return type;
    }
  });
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
    const source = configStore.getConfig;
    if (!id || !source) return;
    const config = JSON.parse(JSON.stringify(source));
    for (let i = 0; i < config.pages.length; i++) {
      for (let j = 0; j < config.pages[i].modules.length; j++) {
        if (config.pages[i].modules[j].id === id) {
          config.pages[i].modules.splice(j, 1);
          moduleActiveStore.setModuleActive('global');
          configStore.setConfig({
            ...config,
            pages: [...config.pages],
          }, { immediate: true });
          return;
        }
      }
    }
  });

  /** 扁平顺序重排：合并到第一页 modules，其余页 modules 清空 */
  const reorderFlattenedModules = useMemoizedFn((ordered: unknown[]) => {
    const config = configStore.getConfig;
    if (!config?.pages?.length) return;
    const snapshot = pinInfo1ModulesFirst(
      ordered.map((m) => JSON.parse(JSON.stringify(m))),
    );
    const first = { modules: snapshot };
    const rest = config.pages.slice(1).map(() => ({ modules: [] }));
    configStore.setConfig({
      ...config,
      pages: [first, ...rest],
    }, { immediate: true });
  });

  const addModuleByType = useMemoizedFn((type: ResumeModuleType) => {
    const config = configStore.getConfig;
    if (!config) return;
    const max = RESUME_MODULE_MAX_COUNT[type];
    const cur = countResumeModulesByType(config, type);
    if (cur >= max) {
      message.warning(th('maxModules', { name: typeLabel(type), max }));
      return;
    }
    const mod = createEmptyResumeModule(type);
    if (!config.pages?.length) {
      const next = JSON.parse(JSON.stringify(config));
      next.pages = [{ modules: [mod] }];
      configStore.setConfig(next, { immediate: true });
      moduleActiveStore.setModuleActive(mod.id);
      return;
    }
    const next = JSON.parse(JSON.stringify(config));
    if (type === 'info1') next.pages[0].modules.unshift(mod);
    else next.pages[0].modules.push(mod);
    next.pages[0].modules = pinInfo1ModulesFirst(next.pages[0].modules);
    configStore.setConfig(next, { immediate: true });
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
          configStore.setConfig(next, { immediate: true });
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
