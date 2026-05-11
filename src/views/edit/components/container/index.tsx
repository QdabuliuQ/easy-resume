import Resume from './resume';

const RESUME_MENU_KEY = 'resume';
const AI_SCORE_MENU_KEY = 'ai-score';
const RESUME_TEMPLATE_MENU_KEY = 'resume-template';
const GENERAL_SETTINGS_MENU_KEY = 'general-settings';

const PANEL_MENU_KEYS = [
  RESUME_MENU_KEY,
  AI_SCORE_MENU_KEY,
  RESUME_TEMPLATE_MENU_KEY,
  'page-settings',
  GENERAL_SETTINGS_MENU_KEY,
] as const;

type ContainerProps = {
  menuActiveKey: string;
};

export default function Container({ menuActiveKey }: ContainerProps) {
  if (!PANEL_MENU_KEYS.includes(menuActiveKey as (typeof PANEL_MENU_KEYS)[number])) {
    return null;
  }

  return (
    <div className='editor-shell-inset flex h-full min-h-0 w-[450px] min-w-[450px] shrink-0 flex-col overflow-hidden rounded-[28px] bg-transparent'>
      <div className='flex min-h-0 flex-1 flex-col'>
        <Resume menuActiveKey={menuActiveKey} />
      </div>
    </div>
  );
}
