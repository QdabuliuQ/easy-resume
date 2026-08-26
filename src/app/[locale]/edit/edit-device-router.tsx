'use client';
import { useLayoutEffect, useState } from 'react';
import { resetEditSessionState } from '@/mobx/resetEditSessionState';
import { resolveDeviceType, type DeviceType } from '@/lib/device';
import DesktopEditPage from './desktop-edit-page';
import MobileEditPage from './mobile-edit-page';

function readClientDevice(): DeviceType {
  const cookie = document.cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('device-view='))
    ?.slice('device-view='.length);
  return resolveDeviceType(navigator.userAgent, cookie);
}

export default function EditDeviceRouter({ initialDevice }: { initialDevice: DeviceType }) {
  const [device, setDevice] = useState<DeviceType>(initialDevice);
  useLayoutEffect(() => {
    setDevice(readClientDevice());
  }, []);
  useLayoutEffect(() => () => resetEditSessionState(), []);
  return device === 'mobile' ? <MobileEditPage /> : <DesktopEditPage />;
}
