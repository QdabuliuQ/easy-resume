import { FilePdf } from '@icon-park/react';
import { useMemoizedFn } from 'ahooks';
import { Button } from 'antd';
import { memo } from 'react';
import {
  PDFDownloadLink,
  StyleSheet,
  View,
  Page,
  Document,
  Text,
} from '@react-pdf/renderer';
import { Info1Render } from '@/modules/info/info1';
import pdfStyle from '@/utils/render';

const MyPDF = () => (
  <Document>
    <Page size='A4' style={pdfStyle.page}>
      <Info1Render name='张三' />
    </Page>
  </Document>
);

function Header() {
  const exportPDF = useMemoizedFn(() => {
    console.log('导出PDF');
  });

  return (
    <div className='w-full h-[50px] sticky top-0 left-0 right-0 bg-white mb-[20px] shadow-md rounded-md z-10 flex items-center justify-end'>
      <div className='pr-[10px]'>
        <PDFDownloadLink document={<MyPDF />} fileName='resume.pdf'>
          <Button
            color='primary'
            variant='solid'
            icon={<FilePdf theme='outline' size='17' fill='#fff' />}
            onClick={exportPDF}
          >
            导出PDF
          </Button>
        </PDFDownloadLink>
      </div>
    </div>
  );
}

export default memo(Header);
