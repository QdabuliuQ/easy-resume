import { setRequestLocale } from 'next-intl/server';
import EditDeviceRouter from './edit-device-router';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  return <EditDeviceRouter />;
}
