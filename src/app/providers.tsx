'use client';

import { ConfigProvider, theme } from 'antd';
import type { ReactNode } from 'react';

export function AntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#fa8362',
          colorBgLayout: '#141414',
          colorBgContainer: '#1f1f1f',
          colorBgElevated: '#262626',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
