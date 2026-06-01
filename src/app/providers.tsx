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
const SW_DEV_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SW_IN_DEV === 'true';

export function AntdProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== 'production' && !SW_DEV_ENABLED) {
      // Keep development free of stale runtime caches.
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())));
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => undefined);
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
