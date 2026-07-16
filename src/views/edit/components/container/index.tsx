import Resume from './resume';

const RESUME_MENU_KEY = 'resume';
const AI_SCORE_MENU_KEY = 'ai-score';
const AI_MODIFY_MENU_KEY = 'ai-modify';
const RESUME_TEMPLATE_MENU_KEY = 'resume-template';
const GENERAL_SETTINGS_MENU_KEY = 'general-settings';

const PANEL_MENU_KEYS = [
  RESUME_MENU_KEY,
  AI_SCORE_MENU_KEY,
  AI_MODIFY_MENU_KEY,
  RESUME_TEMPLATE_MENU_KEY,
  'page-settings',
  GENERAL_SETTINGS_MENU_KEY,
  'my-resumes',
] as const;

type ContainerProps = {
  menuActiveKey: string;
  fullWidth?: boolean;
};

export default function Container({ menuActiveKey, fullWidth }: ContainerProps) {
  if (!PANEL_MENU_KEYS.includes(menuActiveKey as (typeof PANEL_MENU_KEYS)[number])) {
    return null;
  }

  return (
    <div
      className={`editor-shell-inset flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-transparent ${fullWidth ? 'w-full min-w-0 max-w-none rounded-none' : 'w-[500px] min-w-[500px] shrink-0 rounded-[28px]'}`}
    >
      <div className='flex min-h-0 flex-1 flex-col'>
        <Resume menuActiveKey={menuActiveKey} />
      </div>
    </div>
  );
}
