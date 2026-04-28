import { memo } from 'react';
import ModuleEdit from '../../panel/components/moduleEdit';

function Resume() {
  return (
    <div className='flex h-full min-h-0 flex-1 flex-col text-black'>
      <div className='min-h-0 flex-1 overflow-auto'>
        <div className='m-[20px]'>
          <ModuleEdit />
        </div>
      </div>
    </div>
  );
}

export default memo(Resume);
