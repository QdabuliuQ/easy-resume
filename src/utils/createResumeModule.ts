export type ResumeModuleType =
  | 'info1'
  | 'certificate'
  | 'skill'
  | 'job'
  | 'project'
  | 'education'
  | 'other';

function makeId() {
  return typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const EMPTY_OPTIONS: Record<ResumeModuleType, Record<string, unknown>> = {
  info1: {
    name: '',
    phone: '',
    email: '',
    city: '',
    status: '',
    intentCity: '',
    intentPosts: '',
    wechat: '',
    birthday: '',
    gender: '',
    stature: '',
    weight: '',
    ethnic: '',
    origin: '',
    maritalStatus: '',
    politicalStatus: '',
    site: '',
    expectedSalary: ['', ''],
    avatar: '',
    position: 'right',
    showTitle: false,
    layout: [
      ['phone', 'email', 'city'],
      ['wechat', 'site'],
      ['birthday', 'gender'],
      ['status', 'intentCity', 'intentPosts', 'expectedSalary'],
    ],
  },
  job: {
    title: '工作经历',
    items: [],
  },
  project: {
    title: '项目经历',
    items: [],
  },
  education: {
    title: '教育经历',
    items: [],
  },
  certificate: {
    title: '证书',
    items: [],
  },
  skill: {
    title: '专业技能',
    description: '',
  },
  other: {
    title: '其他',
    description: '',
  },
};

export function createEmptyResumeModule(type: ResumeModuleType) {
  return {
    type,
    id: makeId(),
    options: JSON.parse(JSON.stringify(EMPTY_OPTIONS[type])),
  } as {
    type: string;
    id: string;
    options: Record<string, unknown>;
  };
}
