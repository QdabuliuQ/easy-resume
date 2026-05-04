import { memo } from 'react';

function Title(props: { title: string }) {
  return (
    <div className="relative mb-2.5 pl-[15px] text-base font-semibold text-[#1677ff] before:absolute before:left-0 before:top-1/2 before:h-[80%] before:w-[5px] before:-translate-y-1/2 before:rounded-[5px] before:bg-[#1677ff] before:content-['']">
      {props.title}
    </div>
  );
}

export default memo(Title);