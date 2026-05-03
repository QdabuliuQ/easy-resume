import { memo, useState } from 'react';
import { observer } from 'mobx-react';
import Canvas from './components/canvas';
import Container from './components/container';
import Header from './components/header';
import Menu from './components/menu/index';

const DEFAULT_MENU_KEY = 'resume';

function Edit() {
  const [menuActiveKey, setMenuActiveKey] = useState(DEFAULT_MENU_KEY);

  return (
    <div className='flex h-screen w-screen flex-col overflow-hidden'>
      <div className='h-[50px] w-full bg-[#444145]'>
        <Header />
      </div>
      <div className='flex min-h-0 flex-1'>
        <Menu activeKey={menuActiveKey} onActiveKeyChange={setMenuActiveKey} />
        <Container menuActiveKey={menuActiveKey} />
        <div className='box-border flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
          <Canvas />
        </div>
      </div>
    </div>
  );
}

export default memo(observer(Edit));
