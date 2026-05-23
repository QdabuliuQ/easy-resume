'use client';
import dynamic from 'next/dynamic';

const ResumePrintExportClient = dynamic(
  () => import('@/views/export/resumePrintExportClient'),
  { ssr: false },
);

export default ResumePrintExportClient;
