'use client';

import 'antd-mobile/es/global';
import { App, ConfigProvider, theme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { ConfigProvider as MobileConfigProvider } from 'antd-mobile';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeAppTheme,
  type ResolvedTheme,
} from '@/lib/themeStore';

const ADM_PRIMARY = '#0e9c8d';

/** 编辑器 / 后台用；首页不挂，避免 antd-mobile + dayjs 进首屏 */
export function AntdProvider({ children }: { children: ReactNode }) {
  const [isEn, setIsEn] = useState(false);

  useEffect(() => {
    const sync = () => {
      const lang = document.documentElement.lang || '';
      setIsEn(lang.toLowerCase().startsWith('en'));
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    dayjs.locale(isEn ? 'en' : 'zh-cn');
  }, [isEn]);

  const themeSnap = useSyncExternalStore(
    subscribeAppTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const appTheme = themeSnap.split('|')[1] as ResolvedTheme;
  const isDark = appTheme === 'dark';
  return (
    <ConfigProvider
      locale={isEn ? enUS : zhCN}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: ADM_PRIMARY,
          colorBgLayout: isDark ? '#141414' : '#f5f5f5',
          colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
          colorBgElevated: isDark ? '#323236' : '#ffffff',
          colorText: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(30,26,33,0.92)',
        },
        components: {
          Message: {
            contentBg: isDark ? '#323236' : '#ffffff',
            colorText: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(30,26,33,0.92)',
          },
          Notification: {
            colorBgElevated: isDark ? '#323236' : '#ffffff',
          },
        },
      }}
    >
      <App key={appTheme}>
        <MobileConfigProvider>{children}</MobileConfigProvider>
      </App>
    </ConfigProvider>
  );
}
