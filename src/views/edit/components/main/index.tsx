import { memo } from 'react';
import { observer } from 'mobx-react';
import { Scrollbars } from 'react-custom-scrollbars';
import { configStore } from '@/mobx';
import Canvas from '../canvas';
import Header from '../header';

function Main() {
  const canvasW = configStore.mergedGlobalStyle.width;
  return (
    <Scrollbars
      hideTracksWhenNotNeeded
      className='transform translate-x-0 translate-y-0 !h-[calc(100vh-100px)] relative overflow-hidden'
      style={{
        width: canvasW,
        minWidth: canvasW,
        maxWidth: canvasW,
      }}
    >
      <Header />
      <Canvas />
    </Scrollbars>
  );
}

export default memo(observer(Main));
