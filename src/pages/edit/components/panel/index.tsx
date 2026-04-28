import { memo } from 'react';
import ModuleEdit from './components/moduleEdit';

function Panel() {
  return (
    <div className='min-w-[500px] max-w-[500px] w-[500px] bg-white mr-[20px] rounded-md text-black !h-[calc(100vh-100px)] flex min-h-0 flex-col overflow-auto'>
      <div className='p-[20px]'>
        <ModuleEdit />
      </div>
    </div>
  );
}

export default memo(Panel);
