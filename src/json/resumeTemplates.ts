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
import resume17 from './resume17.json';
import resume18 from './resume18.json';
import resume19 from './resume19.json';
import resume20 from './resume20.json';
import resume21 from './resume21.json';
import resume22 from './resume22.json';
import resume23 from './resume23.json';
import resume24 from './resume24.json';
import resume25 from './resume25.json';
import resume26 from './resume26.json';
import resume27 from './resume27.json';
import resume28 from './resume28.json';
import resume29 from './resume29.json';
import resume30 from './resume30.json';
import { resolveResumeAvatarRefsDeep } from '@/lib/resumeAvatarRef';

const rawTemplates: ResumeTemplateItem[] = [
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
  resume17,
  resume18,
  resume19,
  resume20,
  resume21,
  resume22,
  resume23,
  resume24,
  resume25,
  resume26,
  resume27,
  resume28,
  resume29,
  resume30,
];

export const resumeTemplates: ResumeTemplateItem[] = rawTemplates.map((t) =>
  resolveResumeAvatarRefsDeep(t)
);
