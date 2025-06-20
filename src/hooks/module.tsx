import { moduleActiveStore } from '@/mobx';

export function useModuleHandle() {
  const clickModule = (id: string) => {
    moduleActiveStore.setModuleActive(id);
  };
  return { clickModule };
}
