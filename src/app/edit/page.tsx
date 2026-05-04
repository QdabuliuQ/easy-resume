'use client';

import dynamic from 'next/dynamic';
import Loading from '@/components/loading';

const Edit = dynamic(() => import('@/views/edit'), {
  ssr: false,
  loading: () => <Loading />,
});

export default function EditPage() {
  return (
    <div className='min-h-full w-full'>
      <Edit />
    </div>
  );
}
