import { memo, useState } from 'react';
import Main from './components/main';
import Panel from './components/panel';
import Header from './components/header';
import Menu from './components/menu';
import Container from './components/container';
import Canvas from './components/canvas';

const DEFAULT_MENU_KEY = 'resume';

export default memo(function Edit() {
  const [menuActiveKey, setMenuActiveKey] = useState(DEFAULT_MENU_KEY);

  return (
    <div className='w-screen h-screen overflow-hidden flex flex-col'>
      <div className='w-full h-[50px] bg-[#444145]'>
        <Header />
      </div>
      <div className='flex min-h-0 flex-1'>
        <Menu activeKey={menuActiveKey} onActiveKeyChange={setMenuActiveKey} />
        <Container menuActiveKey={menuActiveKey} />
        <div className='h-full min-h-0 flex-1 overflow-auto box-border py-[40px]'>
          <Canvas />
        </div>
      </div>
      {/* <div className='flex items-start justify-center'>
        <Panel />
        <Main />
      </div> */}
    </div>
  );
});
