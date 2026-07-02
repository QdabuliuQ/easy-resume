import {
  degree,
  ethnic,
  gender,
  maritalStatus,
  politicalStatus,
  schoolType,
  status,
} from '@/modules/utils/constant';
import { RESUME_PRESENT_END_DATE } from '@/utils/resumeDateDisplay';

function enumValues(
  opts: ReadonlyArray<{ value: string }>,
): string {
  return opts.map((o) => o.value).join('|');
}

const ETHNIC_ENUM = enumValues(ethnic);

export const RESUME_FIELD_ENUMS = {
  pageSize: 'A4|A3|A5|Letter',
  globalLayout: 'default|line|rounded|leftCol|rightCol',
  resumeFont: 'system|noto-sans-sc|noto-serif-sc',
  info1Position: 'left|right|center',
  gender: enumValues(gender),
  status: enumValues(status),
  maritalStatus: enumValues(maritalStatus),
  politicalStatus: enumValues(politicalStatus),
  degree: enumValues(degree),
  schoolType: enumValues(schoolType),
  ethnic: ETHNIC_ENUM,
  presentEnd: RESUME_PRESENT_END_DATE,
} as const;

/** 与面板/ resume.json 一致的 JSON 字段规范（AI 修改/导入共用） */
export const RESUME_JSON_SCHEMA_PROMPT = `
简历根对象 resume：
- name: string — 简历文件名/标题，非姓名
- globalStyle: object — 见 globalStyle
- pages: array — 至少 1 页；每页 modules 至少 1 个模块
- exportPages?: number[] | null — 导出页码索引，常 [0]

globalStyle：
- pageSize: enum(${RESUME_FIELD_ENUMS.pageSize})
- fontSize: number — 如 10–18，可 0.5 步进
- lineHeight: number — 行高倍数，如 1.3
- moduleMargin: number — 模块间距 px
- padding?: number — 页内边距 px
- color: string — 主题色
- backgroundColor: string — 背景色
- headerType?: number — 标题样式 1–11
- resumeFont?: enum(${RESUME_FIELD_ENUMS.resumeFont})
- layout?: enum(${RESUME_FIELD_ENUMS.globalLayout})

模块 modules[]（每项）：
- type: enum(info1|certificate|education|job|project|skill|other)
- id: string — 与输入一致，禁止修改
- options: object — 按 type 见下

info1.options（全简历有且只能 1 个 info1；不可对话新增/删除）：
- name: string — 姓名
- phone, email, wechat, site: string
- city: string — 省/市级联展示，如 广东/深圳 或 广东 - 深圳
- status: enum(${RESUME_FIELD_ENUMS.status})
- intentCity: string — 意向城市，可多选展示串
- intentPosts: string — 意向岗位，逗号分隔
- birthday: string(YYYY-MM-DD)
- gender: enum(${RESUME_FIELD_ENUMS.gender})
- stature, weight: string | null — 身高体重
- ethnic: enum(${RESUME_FIELD_ENUMS.ethnic}) | null
- origin: string | null — 籍贯，格式同 city
- maritalStatus: enum(${RESUME_FIELD_ENUMS.maritalStatus}) | null
- politicalStatus: enum(${RESUME_FIELD_ENUMS.politicalStatus}) | null
- expectedSalary: string[2] — 期望薪资上下限，如 ["18k","28k"]
- position: enum(${RESUME_FIELD_ENUMS.info1Position}) — 头像位置
- showTitle?: boolean
- showKeys?: string[] — 预览展示字段 key 列表
- layout: string[][] — 字段排版矩阵，元素为 info1 字段 key
- avatar: string — 头像；AI 修改通常不传、不改动

job.options：
- title: string — 默认「工作经历」
- items: array — 每项：
  - id?: string
  - company: string — 公司
  - post: string — 职位（非 postDepartment）
  - department: string — 部门
  - city: string | string[] — 工作城市
  - startDate: string(YYYY-MM) — 开始
  - endDate: string(YYYY-MM) | "${RESUME_PRESENT_END_DATE}" — 结束
  - description: html — 工作描述

project.options：
- title: string — 默认「项目经历」
- items[]:
  - id?: string
  - name: string — 项目名称（非 projectName）
  - role: string — 项目角色
  - startDate, endDate: 同 job
  - description: html

education.options：
- title: string — 默认「教育经历」
- items[]:
  - id?: string
  - school: string
  - degree: enum(${RESUME_FIELD_ENUMS.degree})
  - major: string — 专业
  - academy: string — 学院
  - city: string | string[]
  - tags: string[] — 学校标签，enum 值取自 ${RESUME_FIELD_ENUMS.schoolType}，可空数组
  - startDate, endDate: 同 job（禁用 time/studyTime 字段名）
  - description: html

skill.options：
- title: string — 如「专业技能」
- description: html — 主内容（本模板无 items）

other.options：
- title: string — 用户自定义，如「个人优势」
- description: html — 主内容

certificate.options：
- title: string — 如「证书」
- items[]:
  - id?: string
  - name: string — 证书名称
  - date: string(YYYY-MM-DD) — 获证日期

时间字段统一：job/project/education 用 startDate + endDate，禁止 time[]、studyTime[]。
富文本 html：仅允许 <b> <i> <u> <ul> <li>；禁止 <ol> <script> 等。

模块增删：
- 可对话新增类型：certificate|job|project|education|skill|other（简历尚无该 type 时 add_module）
- 已有模块时「新增一条」→ 对应 items 追加
- info1 不可对话新增；不可删除
`.trim();
