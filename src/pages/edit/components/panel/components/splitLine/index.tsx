import { memo } from 'react';

function SplitLine() {
  return (
    <div
      style={{ borderTopWidth: '3px' }}
      className='w-full mt-[20px] mb-[10px] border-t border-[#e5e5e5] border-dashed'
    ></div>
  );
}

export default memo(SplitLine);
