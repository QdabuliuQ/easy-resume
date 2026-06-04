import type { PanelHeroProps } from './index';

export function resolvePanelHeroContent(
  menuActiveKey: string,
  tr: (key: string) => string,
): Pick<PanelHeroProps, 'eyebrow' | 'title' | 'description' | 'chip'> {
  const isAiScore = menuActiveKey === 'ai-score';
  const isResumeTemplate = menuActiveKey === 'resume-template';
  const isGeneralSettings = menuActiveKey === 'general-settings';
  const isPageSettings = menuActiveKey === 'page-settings';

  return {
    eyebrow: isAiScore
      ? 'AI SCORE'
      : isResumeTemplate
        ? 'TEMPLATES'
        : isGeneralSettings
          ? 'GLOBAL'
          : isPageSettings
            ? 'PAGE'
            : 'CONFIG',
    title: isAiScore
      ? tr('panelTitleAi')
      : isResumeTemplate
        ? tr('panelTitleTemplate')
        : isGeneralSettings
          ? tr('panelTitleGeneral')
          : isPageSettings
            ? tr('panelTitlePageSettings')
            : tr('panelTitleDefault'),
    description: isAiScore
      ? tr('panelDescAi')
      : isResumeTemplate
        ? tr('panelDescTemplate')
        : isGeneralSettings
          ? tr('panelDescGeneral')
          : isPageSettings
            ? tr('panelDescPageSettings')
            : tr('panelDescDefault'),
    chip: isAiScore
      ? tr('chipAi')
      : isResumeTemplate
        ? tr('chipTemplate')
        : isGeneralSettings
          ? tr('chipGeneral')
          : isPageSettings
            ? tr('chipPageSettings')
            : tr('chipEdit'),
  };
}
