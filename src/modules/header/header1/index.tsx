import { GlobalStyle } from '@/modules/utils/common.type';
import { memo } from 'react';

export interface Header1Props {
  title: string;
}

interface Props {
  config: Header1Props;
  globalStyle: GlobalStyle;
}

function Header1(props: Props) {
  const { config, globalStyle } = props;
  if (!config) {
    return null;
  }
  const { title } = config;
  const { color } = globalStyle;

  return (
    <div
      style={{ color }}
      className='font-bold pl-[15px] pt-[3px] pb-[3px] relative font-size-[15px]'
    >
      <span className='leading-none'>{title}</span>
      <div
        style={{ backgroundColor: color }}
        className='w-[3px] h-full absolute left-0 top-0'
      ></div>
      <div
        style={{ backgroundColor: color }}
        className='w-full h-full absolute top-0 left-0 opacity-[0.1]'
      ></div>
    </div>
  );
}

export default memo(Header1);
