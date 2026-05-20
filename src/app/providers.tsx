'use client';

import 'antd-mobile/es/global';
import { App, ConfigProvider, theme } from 'antd';
import { ConfigProvider as MobileConfigProvider } from 'antd-mobile';
import { useSyncExternalStore, type ReactNode } from 'react';
import {
  getAppTheme,
  getServerAppTheme,
  subscribeAppTheme,
} from '@/lib/themeStore';

const ADM_PRIMARY = '#fa8362';

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
