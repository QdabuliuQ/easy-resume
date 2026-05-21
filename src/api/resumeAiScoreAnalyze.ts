import { chatCompletionAssistantContent, postBigmodelChatCompletions } from '@/api/bigmodelChat';

export type ResumeAiDimensionEvaluate = {
  dimensionName: string;
  status: string;
  remark: string;
};

export type ResumeAiFieldOptimize = {
  pageIndex: number;
  moduleType: string;
  moduleId: string;
  /** job/project/education/certificate 的 options.items[].id，单条模块可省略 */
  moduleItemId?: string;
  fieldKey: string;
  optimizeReason: string;
  optimizeValue: string;
};

export type ResumeAiAnalyzeResult = {
  totalScore: number;
  dimensionEvaluate: ResumeAiDimensionEvaluate[];
  fieldOptimizeList: ResumeAiFieldOptimize[];
};

const RESUME_AI_ANALYZE_PROMPT = `你是资深HR资深面试官，专门做前端简历智能评分与字段校验优化。

### 一、简历JSON结构说明
顶层是 pages 数组，代表多个简历页面；
每个 page 包含 modules 数组，为当前页面下的简历模块；
每个模块固定字段：type（模块类型）、id（模块ID，写入 moduleId）、options；
模块类型映射：
info1 = 个人信息模块
certificate = 证书模块
skill = 专业技能模块
job = 工作经历模块
project = 项目经历模块
education = 教育经历模块
other = 其他自定义模块（富文本）

多条目模块（job / project / education / certificate）结构：
options.items 为数组，每条经历/项目/证书/教育为独立对象；
每条 item 必有唯一字符串字段 id（UUID），写入 moduleItemId；
moduleId 只能是父模块的 id（如工作经历模块 id="4"），绝不能把 item.id 当成 moduleId；
moduleType 必须与父模块 type 一致（如 id="5" 且 type="project" 时 moduleType 只能是 project，不能写成 job）。

### 二、字段校验白名单规则
只允许对白名单内的字段做校验和优化，不在白名单的字段一律跳过，不加入fieldOptimizeList：
certificate 白名单：name
skill 白名单：description
job 白名单：post、description
project 白名单：name、role、description
education 白名单：major、description
other 白名单：description
注意：info1.options.avatar 字段默认存在，仅作为头像占位，不参与任何校验与优化，不得在 fieldOptimizeList 中输出该字段。

### 三、评分&分析规则
1. 基于传入的完整简历pages整体结构，给出简历整体综合评分，分值范围 0-100 整数；
2. 固定4大整体评估维度，每个维度只允许给出三种状态之一：优秀、待优化、待补充；
维度：简历结构、内容逻辑与STAR法则、专业用词与表达、量化成果与数据支撑
每个维度附带简短评价说明；
3. 逐页、逐模块、逐字段做校验分析，输出：
pageIndex、moduleType、moduleId、fieldKey、optimizeReason、optimizeValue；
job / project / education / certificate 还必须输出 moduleItemId（对应 options.items 中该条的 id）；
skill / other / info1 无 items 数组，不得输出 moduleItemId；
fieldKey 只写条目内字段名（如 description、post），禁止写 items.0.description 这类路径；
文案类字段给出优化后标准内容，隐私冗余字段 optimizeValue 为空字符串；
4. 不新增、不删除原有JSON字段，只做内容与文案优化；
5. 识别重复教育模块、模块排布不合理等整体结构问题；
6. 严格按指定JSON结构返回，不能改字段名、不能缺字段、不能加额外解释文字。

### 四、强制固定返回JSON结构
只返回以下标准JSON，不要任何多余内容：
{
  "totalScore": 85,
  "dimensionEvaluate": [
    {
      "dimensionName": "简历结构",
      "status": "优秀",
      "remark": "评价说明"
    },
    {
      "dimensionName": "内容逻辑与STAR法则",
      "status": "待优化",
      "remark": "评价说明"
    },
    {
      "dimensionName": "专业用词与表达",
      "status": "待优化",
      "remark": "评价说明"
    },
    {
      "dimensionName": "量化成果与数据支撑",
      "status": "待补充",
      "remark": "评价说明"
    }
  ],
  "fieldOptimizeList": [
    {
      "pageIndex": 0,
      "moduleType": "job",
      "moduleId": "4",
      "moduleItemId": "5d31936c-c39e-40e1-94a7-f4201ffd7c24",
      "fieldKey": "description",
      "optimizeReason": "工作成果描述偏空泛，缺少量化结果与关键动作",
      "optimizeValue": "负责核心后台系统重构，主导接口性能优化与缓存策略升级，将高峰期接口 P95 从 420ms 降至 180ms，错误率下降 38%，支撑日均 80 万次请求稳定运行。"
    },
    {
      "pageIndex": 0,
      "moduleType": "project",
      "moduleId": "5",
      "moduleItemId": "edeb5958-2a7c-4c67-83db-c86b22c0e3d0",
      "fieldKey": "role",
      "optimizeReason": "角色描述可更突出职责层级",
      "optimizeValue": "前端技术负责人"
    }
  ]
}

下面是我要你分析的简历 JSON 配置内容：`;

function stripAssistantJsonFence(s: string): string {
  const t = s.trim();
  const m = /^```(?:json)?\s*\r?\n?([\s\S]*?)```$/im.exec(t);
  if (m) return m[1].trim();
  return t;
}

function parseResumeAiAnalyzeResult(raw: string): ResumeAiAnalyzeResult {
  const text = stripAssistantJsonFence(raw);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('模型返回中未找到 JSON 对象');
  const j = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  const totalScore = Number(j.totalScore);
  if (!Number.isFinite(totalScore)) throw new Error('totalScore 无效');
  const dimensionEvaluate = Array.isArray(j.dimensionEvaluate) ? j.dimensionEvaluate : [];
  const fieldOptimizeList = Array.isArray(j.fieldOptimizeList) ? j.fieldOptimizeList : [];
  return {
    totalScore,
    dimensionEvaluate: dimensionEvaluate.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        dimensionName: String(r.dimensionName ?? ''),
        status: String(r.status ?? ''),
        remark: String(r.remark ?? ''),
      };
    }),
    fieldOptimizeList: fieldOptimizeList.map((row) => {
      const r = row as Record<string, unknown>;
      const moduleItemIdRaw = r.moduleItemId;
      const moduleItemId =
        typeof moduleItemIdRaw === 'string' && moduleItemIdRaw.trim()
          ? moduleItemIdRaw.trim()
          : undefined;
      return {
        pageIndex: Number(r.pageIndex) || 0,
        moduleType: String(r.moduleType ?? ''),
        moduleId: String(r.moduleId ?? ''),
        moduleItemId,
        fieldKey: String(r.fieldKey ?? ''),
        optimizeReason: String(r.optimizeReason ?? ''),
        optimizeValue: typeof r.optimizeValue === 'string' ? r.optimizeValue : String(r.optimizeValue ?? ''),
      };
    }),
  };
}

export async function analyzeResumeWithBigmodel(resumeJson: unknown): Promise<ResumeAiAnalyzeResult> {
  const jsonText = JSON.stringify(resumeJson ?? {});
  const data = await postBigmodelChatCompletions({
    model: 'GLM-4.7-Flash',
    messages: [
      {
        role: 'system',
        content: '你只输出合法 JSON 对象，禁止 Markdown、禁止代码围栏、禁止任何 JSON 以外的文字。',
      },
      {
        role: 'user',
        content: `${RESUME_AI_ANALYZE_PROMPT}\n${jsonText}`,
      },
    ],
    temperature: 0.2,
  });
  const raw = chatCompletionAssistantContent(data);
  if (!raw.trim()) throw new Error('模型返回为空');
  return parseResumeAiAnalyzeResult(raw);
}
