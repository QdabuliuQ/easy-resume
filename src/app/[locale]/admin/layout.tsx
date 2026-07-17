'use client';

import { AntdProvider } from '@/app/providers';
import AdminShell, { AdminProvider } from '@/views/admin/AdminShell';

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <AntdProvider>
      <AdminProvider>
        <AdminShell locale={params.locale}>{children}</AdminShell>
      </AdminProvider>
    </AntdProvider>
  );
}
