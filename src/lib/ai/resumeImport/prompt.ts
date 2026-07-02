import { RESUME_JSON_SCHEMA_PROMPT } from '@/lib/ai/resumeFieldSchema';

export const RESUME_IMPORT_SYSTEM = `你是简历结构化提取助手。根据用户提供的简历纯文本，输出 JSON。
要求：
1. 只输出一个 JSON 对象，根字段为 pages 数组，不要 markdown 代码块。
2. 每个 module 只需 type 和 options，不要 id、layout、avatar、position、showKeys。
3. 字段类型与命名须严格遵循下列 schema；禁止 time[]、studyTime[]、postDepartment、projectName。
4. 日期：经历起止用 startDate/endDate，格式 YYYY-MM，结束可为「至今」；证书 date 用 YYYY-MM-DD；生日 YYYY-MM-DD。
5. 枚举字段须使用合法取值（如 degree、gender、status）；不确定则省略该字段。
6. skill / other / 经历 description 可先输出纯文本（换行 \\n），导入后会转富文本。
7. pages 通常只 1 个元素；modules 为数组，每项含 type、options。
8. 不要编造文本中没有的信息。

${RESUME_JSON_SCHEMA_PROMPT}`;

export const RESUME_IMPORT_HUMAN = `请从以下简历文本提取内容，按渲染器模块结构输出 JSON（仅 pages）：

---
{resumeText}
---`;
