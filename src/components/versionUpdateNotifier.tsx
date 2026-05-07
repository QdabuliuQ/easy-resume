'use client';

import { Modal } from 'antd';
import { useEffect, useRef } from 'react';
import { withBasePath } from '@/lib/withBasePath';

const POLL_MS = 60_000;

export function VersionUpdateNotifier() {
  const baselineRef = useRef<string | null>(null);
  const dismissedRef = useRef<string | null>(null);
  const modalOpenRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const url = withBasePath('/api/version');

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

    const tick = async () => {
      const buildId = await fetchBuildId();
      if (buildId == null) return;
      if (baselineRef.current === null) {
        baselineRef.current = buildId;
        return;
      }
      if (buildId === baselineRef.current) return;
      if (buildId === dismissedRef.current) return;
      if (modalOpenRef.current) return;
      modalOpenRef.current = true;
      Modal.confirm({
        title: '发现新版本',
        content: '站点已发布更新，请刷新页面以使用最新版本。',
        okText: '立即刷新',
        cancelText: '稍后',
        centered: true,
        zIndex: 1200,
        onOk: () => {
          window.location.reload();
        },
        onCancel: () => {
          dismissedRef.current = buildId;
          modalOpenRef.current = false;
        },
        afterClose: () => {
          modalOpenRef.current = false;
        },
      });
    };

    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => window.clearInterval(id);
  }, []);

  return null;
}
