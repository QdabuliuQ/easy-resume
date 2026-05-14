const ZH: Record<string, string> = {
  name: '姓名',
  phone: '手机号',
  email: '邮箱',
  city: '城市',
  status: '状态',
  intentCity: '意向城市',
  intentPosts: '意向职位',
  wechat: '微信号',
  birthday: '生日',
  gender: '性别',
  stature: '身高',
  weight: '体重',
  ethnic: '民族',
  origin: '籍贯',
  maritalStatus: '婚姻状况',
  politicalStatus: '政治面貌',
  expectedSalary: '期望薪资',
  site: '个人网站',
  avatar: '头像',
};
const EN: Record<string, string> = {
  name: 'Name',
  phone: 'Phone',
  email: 'Email',
  city: 'City',
  status: 'Status',
  intentCity: 'Target cities',
  intentPosts: 'Target roles',
  wechat: 'WeChat',
  birthday: 'Birthday',
  gender: 'Gender',
  stature: 'Height',
  weight: 'Weight',
  ethnic: 'Ethnicity',
  origin: 'Hometown',
  maritalStatus: 'Marital status',
  politicalStatus: 'Political status',
  expectedSalary: 'Expected salary',
  site: 'Website',
  avatar: 'Photo',
};
export type Info1PdfLocale = 'zh' | 'en';
export function getInfo1FieldLabel(key: string, locale: Info1PdfLocale): string {
  const m = locale === 'en' ? EN : ZH;
  return m[key] ?? ZH[key] ?? key;
}
