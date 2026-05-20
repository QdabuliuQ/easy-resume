'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Loading from '@/components/loading';

const MobileEdit = dynamic(() => import('@/views/edit/mobile'), {
  ssr: false,
  loading: () => <Loading />,
});

export default function MobileEditPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MobileEdit />
    </Suspense>
  );
}
