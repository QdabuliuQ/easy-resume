'use client';

import { App, ConfigProvider, theme } from 'antd';
import { useSyncExternalStore, type ReactNode } from 'react';
import {
  getAppTheme,
  getServerAppTheme,
  subscribeAppTheme,
} from '@/lib/themeStore';

export function AntdProvider({ children }: { children: ReactNode }) {
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
          colorPrimary: '#fa8362',
          colorBgLayout: isDark ? '#141414' : '#f5f5f5',
          colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
          colorBgElevated: isDark ? '#262626' : '#ffffff',
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
