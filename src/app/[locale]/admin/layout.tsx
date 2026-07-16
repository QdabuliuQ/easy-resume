'use client';

import AdminShell, { AdminProvider } from '@/views/admin/AdminShell';

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <AdminProvider>
      <AdminShell locale={params.locale}>{children}</AdminShell>
    </AdminProvider>
  );
}
