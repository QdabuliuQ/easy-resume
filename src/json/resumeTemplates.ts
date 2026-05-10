export type ResumeTemplateItem = {
  id: string;
  title: string;
  config: {
    name: string;
    globalStyle: Record<string, unknown>;
    pages: Array<{ modules: unknown[] }>;
  };
};

import resume1 from './resume1.json';
import resume2 from './resume2.json';
import resume3 from './resume3.json';
import resume4 from './resume4.json';
import resume5 from './resume5.json';
import resume6 from './resume6.json';
import resume7 from './resume7.json';
import resume8 from './resume8.json';
import resume9 from './resume9.json';
import resume10 from './resume10.json';
import resume11 from './resume11.json';
import resume12 from './resume12.json';
import resume13 from './resume13.json';
import resume14 from './resume14.json';
import resume15 from './resume15.json';
import resume16 from './resume16.json';

export const resumeTemplates: ResumeTemplateItem[] = [
  resume1,
  resume2,
  resume3,
  resume4,
  resume5,
  resume6,
  resume7,
  resume8,
  resume9,
  resume10,
  resume11,
  resume12,
  resume13,
  resume14,
  resume15,
  resume16,
];
