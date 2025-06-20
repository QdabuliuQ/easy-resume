import { memo } from 'react';

export default memo(function Margin(props: { height: number }) {
  return (
    <div
      className='w-full'
      style={{
        height: props.height + 'px',
      }}
    ></div>
  );
});
