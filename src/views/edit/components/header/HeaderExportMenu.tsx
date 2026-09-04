'use client';

import { DownOutlined } from '@ant-design/icons';
import { Download, FileCode, FilePdf, FileWord, ImageFiles } from '@icon-park/react';
import { Dropdown, Tooltip } from 'antd';
import { observer } from 'mobx-react';
import { useTranslations } from 'next-intl';
import { memo, useMemo, useState } from 'react';
import { resumeImportStore } from '@/mobx';
import { useResumeExport, useResumeExportWarmup } from '@/views/edit/hooks/useResumeExport';
import { actionBtnCls, actionIconSpin, arrowCls, ICON_PRIMARY } from './headerActionStyles';

function HeaderExportMenu() {
  useResumeExportWarmup();
  const t = useTranslations('Edit.header');
  const {
    exportPdf,
    exportPdfkit,
    exportImagePdf,
    exportImage,
    exportJson,
    exportDocx,
    pdfLoading,
    pdfkitLoading,
    imagePdfLoading,
    imageLoading,
    docxLoading,
    exporting,
  } = useResumeExport();
  const importBusy = resumeImportStore.loading;
  const [exportOpen, setExportOpen] = useState(false);
  const actionsDisabled = exporting || importBusy;
  const exportMenuItems = useMemo(
    () => [
      {
        key: 'pdf',
        disabled: actionsDisabled,
        icon: <FilePdf theme='outline' size={16} fill={ICON_PRIMARY} />,
        label: t('exportPdf'),
        onClick: () => void exportPdf(),
      },
      {
        key: 'pdfkit',
        disabled: actionsDisabled,
        icon: <FilePdf theme='outline' size={16} fill={ICON_PRIMARY} />,
        label: t('exportPdfkit'),
        onClick: () => void exportPdfkit(),
      },
      {
        key: 'imagePdf',
        disabled: actionsDisabled,
        icon: <FilePdf theme='outline' size={16} fill={ICON_PRIMARY} />,
        label: t('exportImagePdf'),
        onClick: () => void exportImagePdf(),
      },
      {
        key: 'docx',
        disabled: actionsDisabled,
        icon: <FileWord theme='outline' size={16} fill={ICON_PRIMARY} />,
        label: (
          <span className='inline-flex items-center gap-1.5'>
            {t('exportDocx')}
            <span className='rounded border border-fg/15 px-1 py-px text-[10px] font-medium leading-tight text-fg/45'>
              {t('exportDocxBeta')}
            </span>
          </span>
        ),
        onClick: () => void exportDocx(),
      },
      {
        key: 'image',
        disabled: actionsDisabled,
        icon: <ImageFiles theme='outline' size={16} fill={ICON_PRIMARY} />,
        label: t('exportImage'),
        onClick: () => void exportImage(),
      },
      {
        key: 'json',
        disabled: actionsDisabled,
        icon: <FileCode theme='outline' size={16} fill={ICON_PRIMARY} />,
        label: t('exportJson'),
        onClick: exportJson,
      },
    ],
    [actionsDisabled, exportDocx, exportImage, exportImagePdf, exportJson, exportPdf, exportPdfkit, t],
  );
  const loading = pdfLoading || pdfkitLoading || imagePdfLoading || imageLoading || docxLoading;
  return (
    <Tooltip title={importBusy ? t('importBusy') : undefined}>
      <span className='inline-flex'>
        <Dropdown
          menu={{ items: exportMenuItems }}
          trigger={['hover']}
          mouseEnterDelay={0.08}
          mouseLeaveDelay={0.12}
          disabled={actionsDisabled}
          placement='bottomRight'
          open={exportOpen}
          onOpenChange={(open) => {
            if (!actionsDisabled) setExportOpen(open);
          }}
        >
          <button
            type='button'
            disabled={actionsDisabled}
            aria-label={t('exportLabel')}
            aria-expanded={exportOpen}
            className={actionBtnCls}
          >
            {loading ? (
              <span className={actionIconSpin} aria-hidden />
            ) : (
              <Download theme='outline' size={17} fill={ICON_PRIMARY} />
            )}
            {exporting ? t('exporting') : t('exportLabel')}
            {!actionsDisabled ? <DownOutlined className={arrowCls(exportOpen)} /> : null}
          </button>
        </Dropdown>
      </span>
    </Tooltip>
  );
}

export default memo(observer(HeaderExportMenu));
