'use client';

import { App, Button, Space } from 'antd';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

const POLL_MS = 60_000;
const NOTIFY_KEY = 'easy-resume-version-update';
const STORAGE_KEY = 'easy-resume:dismissed-version-build-id';

export function VersionUpdateNotifier() {
  const t = useTranslations('Version');
  const { notification } = App.useApp();
  const baselineRef = useRef<string | null>(null);
  const dismissedRef = useRef<string | null>(null);
  const showingForRef = useRef<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    try {
      dismissedRef.current = localStorage.getItem(STORAGE_KEY);
    } catch {
      dismissedRef.current = null;
    }

    const url = '/api/version';

    const fetchBuildId = async (): Promise<string | null> => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return null;
        const data = (await res.json()) as { buildId?: string };
        return typeof data.buildId === 'string' ? data.buildId : null;
      } catch {
        return null;
      }
    };

    const persistDismiss = (buildId: string) => {
      dismissedRef.current = buildId;
      try {
        localStorage.setItem(STORAGE_KEY, buildId);
      } catch {
        /* ignore */
      }
    };

    const closeNotify = () => {
      notification.destroy(NOTIFY_KEY);
      showingForRef.current = null;
    };

    const tick = async () => {
      const buildId = await fetchBuildId();
      if (buildId == null) return;
      if (baselineRef.current === null) {
        baselineRef.current = buildId;
        return;
      }
      if (buildId === baselineRef.current) return;
      if (buildId === dismissedRef.current) return;
      if (showingForRef.current === buildId) return;
      showingForRef.current = buildId;
      notification.open({
        key: NOTIFY_KEY,
        message: t('newVersion'),
        description: t('description'),
        duration: 0,
        placement: 'topRight',
        btn: (
          <Space>
            <Button
              onClick={() => {
                persistDismiss(buildId);
                closeNotify();
              }}
            >
              {t('later')}
            </Button>
            <Button type='primary' onClick={() => window.location.reload()}>
              {t('refreshNow')}
            </Button>
          </Space>
        ),
        onClose: () => {
          persistDismiss(buildId);
          showingForRef.current = null;
        },
      });
    };

    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      window.clearInterval(id);
      notification.destroy(NOTIFY_KEY);
    };
  }, [notification, t]);

  return null;
}