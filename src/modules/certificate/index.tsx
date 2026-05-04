import { RESUME_MODULE_ID_ATTR } from '@/components/moduleOperation/constants';
import { memo } from 'react';
import { GlobalStyle } from '../utils/common.type';
import Header1 from '../header/header1';
import { observer } from 'mobx-react';

export interface CertificateProps {
  id: string;
  type: 'certificate';
  options: {
    title: string;
    items: Array<{
      name: string;
      date: string;
    }>;
  };
}

interface Props {
  config: CertificateProps;
  globalStyle: GlobalStyle;
}

function Certificate(props: Props) {
  const { config, globalStyle } = props;
  if (!config) {
    return null;
  }
  const { id, options } = config;

  return (
    <div
      id={id}
      {...{ [RESUME_MODULE_ID_ATTR]: id }}
      className='w-full cursor-pointer'
    >
      <div className='w-full mb-[5px]'>
        <Header1 config={options} globalStyle={globalStyle} />
      </div>
      <div className='w-full'>
        {options.items.map((item, index) => (
          <div
            key={index}
            className='w-full flex justify-between text-black not-last:mb-[5px]'
            style={{ fontSize: globalStyle.fontSize + 'px' }}
          >
            <div className='flex-6'>{item.name}</div>
            <div className='flex-4 text-right'>{item.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(observer(Certificate));
