import { memo } from 'react';

function Header() {
  return (
    <div className='w-full h-[50px] sticky top-0 left-0 right-0 bg-white mb-[20px] shadow-md rounded-md z-10'>
      Header
    </div>
  );
}

export default memo(Header);
