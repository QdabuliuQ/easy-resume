'use client';

import { useEffect } from 'react';

/** 已弃用 SW：卸载并清缓存，避免旧客户端继续拦截请求 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const cleanup = async () => {
      const hadController = Boolean(navigator.serviceWorker.controller);
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      if (hadController || registrations.length > 0) {
        window.location.reload();
      }
    };
    cleanup().catch(() => undefined);
  }, []);

  return null;
}
