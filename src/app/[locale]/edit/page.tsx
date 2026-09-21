import { cookies, headers } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { DEVICE_VIEW_COOKIE, resolveDeviceType } from '@/lib/device';
import DesktopEditPage from './desktop-edit-page';
import MobileEditPage from './mobile-edit-page';
import EditSessionCleanup from './edit-session-cleanup';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const h = headers();
  const c = cookies();
  const initialDevice = resolveDeviceType(
    h.get('user-agent') ?? '',
    c.get(DEVICE_VIEW_COOKIE)?.value,
    h.get('sec-ch-ua-mobile'),
  );
  return (
    <EditSessionCleanup>
      {initialDevice === 'mobile' ? <MobileEditPage /> : <DesktopEditPage />}
    </EditSessionCleanup>
  );
}
