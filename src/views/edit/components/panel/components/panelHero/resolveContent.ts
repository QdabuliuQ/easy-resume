import type { PanelHeroProps } from './index';

export function resolvePanelHeroContent(
  menuActiveKey: string,
  tr: (key: string) => string,
): Pick<PanelHeroProps, 'eyebrow' | 'title' | 'description' | 'chip'> {
  const isAiScore = menuActiveKey === 'ai-score';
  const isAiModify = menuActiveKey === 'ai-modify';
  const isResumeTemplate = menuActiveKey === 'resume-template';
  const isGeneralSettings = menuActiveKey === 'general-settings';
  const isPageSettings = menuActiveKey === 'page-settings';
  const isMyResumes = menuActiveKey === 'my-resumes';

  return {
    eyebrow: isAiScore
      ? 'AI SCORE'
      : isAiModify
        ? 'AI WRITE'
        : isResumeTemplate
          ? 'TEMPLATES'
          : isMyResumes
            ? 'MY RESUMES'
            : isGeneralSettings
              ? 'GLOBAL'
              : isPageSettings
                ? 'PAGE'
                : 'CONFIG',
    title: isAiScore
      ? tr('panelTitleAi')
      : isAiModify
        ? tr('panelTitleAiModify')
        : isResumeTemplate
          ? tr('panelTitleTemplate')
          : isMyResumes
            ? tr('panelTitleMyResumes')
            : isGeneralSettings
              ? tr('panelTitleGeneral')
              : isPageSettings
                ? tr('panelTitlePageSettings')
                : tr('panelTitleDefault'),
    description: isAiScore
      ? tr('panelDescAi')
      : isAiModify
        ? tr('panelDescAiModify')
        : isResumeTemplate
          ? tr('panelDescTemplate')
          : isMyResumes
            ? tr('panelDescMyResumes')
            : isGeneralSettings
              ? tr('panelDescGeneral')
              : isPageSettings
                ? tr('panelDescPageSettings')
                : tr('panelDescDefault'),
    chip: isAiScore
      ? tr('chipAi')
      : isAiModify
        ? tr('chipAiModify')
        : isResumeTemplate
          ? tr('chipTemplate')
          : isMyResumes
            ? tr('chipMyResumes')
            : isGeneralSettings
              ? tr('chipGeneral')
              : isPageSettings
                ? tr('chipPageSettings')
                : tr('chipEdit'),
  };
}
