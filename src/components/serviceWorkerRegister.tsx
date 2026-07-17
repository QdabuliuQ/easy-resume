'use client';

import { useEffect } from 'react';

/** 生产注册 SW；开发环境清掉旧 SW，避免脏缓存 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      const cleanupDevServiceWorker = async () => {
        const hadController = Boolean(navigator.serviceWorker.controller);
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        if (hadController || registrations.length > 0) {
          window.location.reload();
        }
      };
      cleanupDevServiceWorker().catch(() => undefined);
      return;
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          updateViaCache: 'none',
        });
        const pingUpdate = () => {
          void registration.update().catch(() => undefined);
        };
        pingUpdate();
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') pingUpdate();
        });
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[SW] new version installed; reloading…');
            }
          });
        });
      } catch (error) {
        console.error('[SW] registration failed', error);
      }
    };
    register();
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return null;
}
