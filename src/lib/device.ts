export type DeviceType = 'mobile' | 'desktop';

const MOBILE_UA =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i;

export const DEVICE_VIEW_COOKIE = 'device-view';
export const DEVICE_TYPE_HEADER = 'x-device-type';

export function isMobileUserAgent(ua: string): boolean {
  return MOBILE_UA.test(ua);
}

export function resolveDeviceType(
  ua: string,
  cookie?: string | null,
  chMobile?: string | null,
): DeviceType {
  if (isMobileUserAgent(ua) || chMobile === '?1') return 'mobile';
  if (cookie === 'mobile') return 'mobile';
  if (cookie === 'desktop') return 'desktop';
  return 'desktop';
}

export function localePath(locale: string, sub = ''): string {
  return `/${locale}${sub}`;
}
