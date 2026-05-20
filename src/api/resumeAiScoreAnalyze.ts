import { chatCompletionAssistantContent, postBigmodelChatCompletions } from '@/api/bigmodelChat';

export type ResumeAiDimensionEvaluate = {
  dimensionName: string;
  status: string;
  remark: string;
};

/** 多条目存在 options.items[] 的模块；其余模块仅用 moduleId + fieldKey */
export const RESUME_AI_ITEMIZED_MODULE_TYPES = ['job', 'project', 'education', 'certificate'] as const;

export type ResumeAiFieldOptimize = {
  pageIndex: number;
  moduleType: string;
  /** 必须与简历 JSON 中 modules[].id 完全一致 */
  moduleId: string;
  /** job/project/education/certificate 指向 options.items 下标，从 0 开始 */
  moduleItemIndex?: number;
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
每个page包含 modules 数组，为当前页面下的简历模块；
每个模块固定字段：type、id、options；
模块类型映射：
info1 = 个人信息模块
certificate = 证书模块
skill = 专业技能模块
job = 工作经历模块
project = 项目经历模块
education = 教育经历模块
other = 其他自定义模块（富文本）

工作经历(job)、项目经历(project)、教育经历(education)、证书(certificate) 多条记录存放在对应模块的 options.items 数组中（下标从 0 递增）；专业技能(skill)、其他(other) 无 items，文案直接在 options 对应字段。

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
每个维度一条 remark：「优秀」只写客观强项（一句话）；「待优化」「待补充」必须写具体问题与可改进方向。
禁止在任意 remark 中出现「无需优化」「已规范」「无明显问题」「保持即可」等否定式敷衍句单独占一行或作为主要结论。
3. fieldOptimizeList（核心）：只收录「确有改写必要」的白名单字段条目。
若某字段内容已清晰、合规、无需改动，则绝不写入列表；禁止输出理由或条目形如「××规范，无需优化」「暂无建议」「维持原文」。
每条必须同时满足：(a) optimizeReason 明确指出问题类型；(b) optimizeValue 为改写后的完整建议正文。
optimizeValue 必须与对应字段原文在措辞上有实质差异：禁止与原文相同或近乎相同（含仅调换语序、仅换同义词却无信息量增减）；禁止仅为标点或空格微调。
若你无法写出明显优于原文且不同于原文的表述，则不要为该字段生成条目。
隐私类字段仅需删减冗余时 optimizeValue 可为空字符串；其余文案字段 optimizeValue 不得为空。
3b. fieldOptimizeList 定位规则（违反则前端无法应用）：
- moduleId 必须从传入简历 JSON 的 pages[].modules[] 中原样复制对应模块的 id 字段，禁止臆造（例如 JSON 里是 \"id\":\"5\" 却写 job-4）。
- moduleType 必须与模块 type 一致。
- job/project/education/certificate：必须输出整数 moduleItemIndex，表示要修改的是 options.items[moduleItemIndex] 这一条（第一段经历为 0）；多条经历时必须逐条区分，禁止省略或用错误下标。
- skill/other：不要输出 moduleItemIndex，fieldKey 直接对应 options 下的白名单字段。
- fieldKey 只写叶子名（如 description、post、name、role、major），禁止写成 items[0].description。
4. 不新增、不删除原有JSON字段，只做内容与文案优化；
5. 识别重复教育模块、模块排布不合理等整体结构问题（写入 dimensionEvaluate 或相关字段 optimizeReason，勿生成无意义的 fieldOptimizeList 占位项）；
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
      "moduleId": "5",
      "moduleItemIndex": 0,
      "fieldKey": "description",
      "optimizeReason": "项目成果描述偏空泛，缺少量化结果与关键动作",
      "optimizeValue": "负责核心后台系统重构，主导接口性能优化与缓存策略升级，将高峰期接口 P95 从 420ms 降至 180ms，错误率下降 38%，支撑日均 80 万次请求稳定运行。"
    }
  ]
}

说明：fieldOptimizeList 仅包含确有改写必要的字段；每条 optimizeValue 必须与对应原文实质不同；item 类模块必须带正确 moduleItemIndex 与真实 moduleId。若无此类字段则输出空数组 []。

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
      const rawIdx = r.moduleItemIndex;
      let moduleItemIndex: number | undefined;
      if (rawIdx != null && rawIdx !== '') {
        const n = Number(rawIdx);
        if (Number.isFinite(n) && Number.isInteger(n) && n >= 0) moduleItemIndex = n;
      }
      return {
        pageIndex: Number(r.pageIndex) || 0,
        moduleType: String(r.moduleType ?? ''),
        moduleId: String(r.moduleId ?? ''),
        moduleItemIndex,
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
        content:
          '你只输出合法 JSON 对象，禁止 Markdown、禁止代码围栏、禁止任何 JSON 以外的文字。fieldOptimizeList：job/project/education/certificate 必须含 moduleItemIndex；moduleId 必须与输入 JSON 中模块 id 完全一致；optimizeValue 禁止与原文相同或敷衍复述。',
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
