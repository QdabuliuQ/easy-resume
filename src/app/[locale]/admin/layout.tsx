import { AntdProvider } from '@/app/providers';
import AdminShell, { AdminProvider } from '@/views/admin/AdminShell';
import { readAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await readAdminSession();
  return (
    <AntdProvider>
      <AdminProvider initialSession={session ? { username: session.username } : null}>
        <AdminShell locale={params.locale}>{children}</AdminShell>
      </AdminProvider>
    </AntdProvider>
  );
}
