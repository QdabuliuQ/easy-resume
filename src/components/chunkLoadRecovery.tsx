'use client';

import { useEffect } from 'react';
import {
  clearChunkReloadMark,
  isChunkLoadError,
  isNextStaticChunkScript,
  reloadForChunkError,
} from '@/lib/chunkLoadRecovery';

/** 部署后旧页面引用失效 chunk 时自动刷新一次，避免 ChunkLoadError 白屏 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const onLoad = () => clearChunkReloadMark();
    window.addEventListener('load', onLoad);

    const onRejection = (event: PromiseRejectionEvent) => {
      if (!isChunkLoadError(event.reason)) return;
      event.preventDefault();
      reloadForChunkError();
    };

    const onError = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLScriptElement)) return;
      const src = target.src ?? '';
      if (!src || !isNextStaticChunkScript(src)) return;
      reloadForChunkError();
    };

    window.addEventListener('unhandledrejection', onRejection);
    window.addEventListener('error', onError, true);
    return () => {
      window.removeEventListener('load', onLoad);
      window.removeEventListener('unhandledrejection', onRejection);
      window.removeEventListener('error', onError, true);
    };
  }, []);

  return null;
}
