'use client';

import 'antd-mobile/es/global';
import { App, ConfigProvider, theme } from 'antd';
import { ConfigProvider as MobileConfigProvider } from 'antd-mobile';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import {
  getAppTheme,
  getServerAppTheme,
  subscribeAppTheme,
} from '@/lib/themeStore';

const ADM_PRIMARY = '#0e9c8d';

export function AntdProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

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

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) {
            return;
          }
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // New worker installed; the next full reload will pick up new cache.
              console.info('[SW] new content is available; reload to update.');
            }
          });
        });
      } catch (error) {
        console.error('[SW] registration failed', error);
      }
    };

    register();
  }, []);

  const appTheme = useSyncExternalStore(
    subscribeAppTheme,
    getAppTheme,
    getServerAppTheme,
  );
  const isDark = appTheme === 'dark';
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: ADM_PRIMARY,
          colorBgLayout: isDark ? '#141414' : '#f5f5f5',
          colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
          colorBgElevated: isDark ? '#262626' : '#ffffff',
        },
      }}
    >
      <App>
        <MobileConfigProvider>{children}</MobileConfigProvider>
      </App>
    </ConfigProvider>
  );
}
