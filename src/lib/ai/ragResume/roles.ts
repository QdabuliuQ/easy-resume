import type { RagRoleMatch } from '@/lib/ai/ragResume/types';

const ROLE_ALIASES: Record<string, string[]> = {
  'front-end': ['front-end', 'frontend', 'front end', '前端'],
  backend: [
    'backend',
    'back-end',
    '后端',
    '后端开发',
    '后端工程师',
    'java后端',
    'java backend',
    'javabackend',
  ],
  product: ['product', 'pm', '产品', '产品经理'],
  design: ['design', 'ui', 'designer', '设计', 'ui设计'],
  accountant: ['accountant', '会计', '财务会计'],
  legal: ['legal', '法务', '法律顾问'],
  operation: ['operation', 'operations', '运营', '新媒体运营', '内容运营'],
  hr: ['hr', 'human resources', '人力', '人力资源', '招聘专员'],
  teacher: ['teacher', '教师', '老师'],
  nurse: ['nurse', '护士', '护理'],
  sales: ['sales', '销售', '销售顾问', '业务员'],
  'test-engineer': ['test engineer', 'qa', 'tester', '测试', '测试工程师', '软件测试'],
  devops: ['devops', 'ops', '运维', '运维工程师', 'sre'],
  admin: ['admin', '行政', '行政专员', '行政助理'],
  'e-commerce-designer': [
    'e-commerce-designer',
    'ecommerce designer',
    '电商美工',
    '电商设计',
    '美工',
  ],
  purchase: ['purchase', 'purchasing', '采购', '采购专员'],
};

function normalizeToken(text: string): string {
  return text.toLowerCase().replace(/[_\s]+/g, '-').trim();
}

export function normalizeRoleKey(fileStem: string): string {
  return normalizeToken(fileStem).replace(/^-+|-+$/g, '');
}

export function toRoleLabel(roleKey: string): string {
  return roleKey
    .split('-')
    .filter(Boolean)
    .map((x) => x[0].toUpperCase() + x.slice(1))
    .join(' ');
}

export function matchRole(postType: string, roleKeys: string[]): RagRoleMatch | null {
  const normalized = normalizeToken(postType);
  if (!normalized) return null;

  for (const roleKey of roleKeys) {
    if (normalized === roleKey) {
      return { roleKey, roleLabel: toRoleLabel(roleKey) };
    }
  }

  for (const roleKey of roleKeys) {
    const aliases = ROLE_ALIASES[roleKey] ?? [roleKey];
    if (aliases.some((alias) => normalized.includes(normalizeToken(alias)))) {
      return { roleKey, roleLabel: toRoleLabel(roleKey) };
    }
  }

  for (const roleKey of roleKeys) {
    if (normalized.includes(roleKey) || roleKey.includes(normalized)) {
      return { roleKey, roleLabel: toRoleLabel(roleKey) };
    }
  }

  return null;
}
