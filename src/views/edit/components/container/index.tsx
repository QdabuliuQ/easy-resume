import Resume from './resume';

const RESUME_MENU_KEY = 'resume';
const AI_SCORE_MENU_KEY = 'ai-score';

type ContainerProps = {
  menuActiveKey: string;
};

export default function Container({ menuActiveKey }: ContainerProps) {
  if (menuActiveKey !== RESUME_MENU_KEY && menuActiveKey !== AI_SCORE_MENU_KEY) {
    return null;
  }

  return (
    <div className='flex h-full min-h-0 w-[450px] min-w-[450px] shrink-0 flex-col bg-[#38363a]'>
      <div className='flex min-h-0 flex-1 flex-col'>
        <Resume menuActiveKey={menuActiveKey} />
      </div>
    </div>
  );
}
