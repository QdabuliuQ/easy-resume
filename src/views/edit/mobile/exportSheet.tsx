'use client';

import { Button, List, Popup } from 'antd-mobile';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import { useResumeExport } from '../hooks/useResumeExport';

function MobileExportSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('Edit.mobile');
  const th = useTranslations('Edit.header');
  const tm = useTranslations('Edit.menu');
  const { exportPdf, exportImage, exportJson } = useResumeExport();
  const run = (fn: () => void | Promise<void>) => {
    onClose();
    void fn();
  };
  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      bodyStyle={{
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className='px-2 pt-3'>
        <List className='mb-[10px]'>
          <List.Item className='text-[14px]' clickable onClick={() => run(exportPdf)}>
            {th('exportPdf')}
          </List.Item>
          <List.Item className='text-[14px]' clickable onClick={() => run(exportImage)}>
            {th('exportImage')}
          </List.Item>
          <List.Item className='text-[14px]' clickable onClick={() => run(exportJson)}>
            {th('exportJson')}
          </List.Item>
        </List>
        <Button block fill='none' onClick={onClose} className='!text-[var(--adm-color-weak)] text-[13px]'>
          {tm('cancel')}
        </Button>
      </div>
    </Popup>
  );
}

export default memo(MobileExportSheet);
