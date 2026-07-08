'use client';

import { useEffect } from 'react';
import { useMemoizedFn } from 'ahooks';
import { configStore } from '@/mobx';

export function useEditHistory() {
  const undo = useMemoizedFn(() => {
    configStore.undo();
  });

  const redo = useMemoizedFn(() => {
    configStore.redo();
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [redo, undo]);

  return {
    canUndo: configStore.canUndo,
    canRedo: configStore.canRedo,
    undo,
    redo,
  };
}
