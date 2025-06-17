import { memo } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import Header from '../header';
import Canvas from '../canvas';

function Main() {
  return (
    <Scrollbars
      hideTracksWhenNotNeeded
      className='min-w-[595px] max-w-[595px] transform translate-x-0 translate-y-0 !h-[calc(100vh-100px)] relative overflow-hidden'
    >
      <Header />
      <Canvas />
    </Scrollbars>
  );
}

export default memo(Main);
