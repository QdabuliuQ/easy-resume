import { cookies, headers } from 'next/headers';
import {
  DEVICE_TYPE_HEADER,
  DEVICE_VIEW_COOKIE,
  resolveDeviceType,
  type DeviceType,
} from '@/lib/device';

/** 服务端按 UA / Cookie / 中间件头判断设备 */
export async function getRequestDeviceType(): Promise<DeviceType> {
  const h = await headers();
  const fromMw = h.get(DEVICE_TYPE_HEADER);
  if (fromMw === 'mobile' || fromMw === 'desktop') return fromMw;
  const cookie = (await cookies()).get(DEVICE_VIEW_COOKIE)?.value;
  return resolveDeviceType(
    h.get('user-agent') ?? '',
    cookie,
    h.get('sec-ch-ua-mobile'),
  );
}
