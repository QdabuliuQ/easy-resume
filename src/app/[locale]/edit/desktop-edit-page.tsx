'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Loading from '@/components/loading';

const Edit = dynamic(() => import('@/views/edit'), {
  ssr: false,
  loading: () => <Loading />,
});

export default function DesktopEditPage() {
  return (
    <div className='min-h-full w-full'>
      <Suspense fallback={<Loading />}>
        <Edit />
      </Suspense>
    </div>
  );
}
