import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Embeddings } from '@langchain/core/embeddings';
import { env as transformersEnv, pipeline } from '@xenova/transformers';
import { matchRole, normalizeRoleKey, toRoleLabel } from '@/lib/ai/ragResume/roles';
import type { OptimizeScene, RagKnowledgeDoc } from '@/lib/ai/ragResume/types';
import { descriptionPolishRulesForScene } from '@/lib/ai/descriptionFormat';

const RAG_ROOT = path.join(process.cwd(), 'src', 'rag-resume-knowledge');
const GLOBAL_RULE_FILE = 'global-rules.txt';
export const SCHEMA_GLOSSARY_FILE = 'schema-field-glossary.txt';

// 不同润色场景各自绑定一组知识文件：
// - dir: 该场景的规则目录
// - sceneGlobalFile: 该场景通用规则
// - roleSuffix: 岗位规则文件后缀，用于按岗位补充更细的规则
const SCENE_CONFIG: Record<
  OptimizeScene,
  { dir: string; sceneGlobalFile: string; roleSuffix: string }
> = {
  skill: {
    dir: 'skill-rules',
    sceneGlobalFile: 'global-skill-format.txt',
    roleSuffix: '-skill.txt',
  },
  work: {
    dir: 'work-experience-rules',
    sceneGlobalFile: 'global-work-format.txt',
    roleSuffix: '-work.txt',
  },
  project: {
    dir: 'project-experience-rules',
    sceneGlobalFile: 'global-project-format.txt',
    roleSuffix: '-project.txt',
  },
};

type IndexedChunk = {
  // 原始知识片段文本。后续会直接拼接进 Prompt 作为 grounding context。
  content: string;
  // 该片段的 embedding 向量，用于做相似度检索。
  vector: number[];
};

// 同一个场景/岗位的索引构建成本较高，因此按 cacheKey 缓存 Promise，避免并发重复构建。
const vectorStoreCache = new Map<string, Promise<IndexedChunk[]>>();

let extractorPromise: Promise<
  (text: string, opts: { pooling: 'mean'; normalize: boolean }) => Promise<{ data: number[] }>
> | null = null;

let transformersInited = false;
let embeddingUnavailable = false;

function initTransformersEnv() {
  if (transformersInited) return;
  transformersInited = true;
  transformersEnv.cacheDir = path.join(process.cwd(), '.cache', 'transformers');
  if (process.env.TRANSFORMERS_OFFLINE === '1') {
    transformersEnv.allowRemoteModels = false;
  }
}

async function getExtractor() {
  if (embeddingUnavailable) throw new Error('embedding unavailable');
  initTransformersEnv();
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2').catch((e) => {
      embeddingUnavailable = true;
      extractorPromise = null;
      throw e;
    }) as Promise<
      (text: string, opts: { pooling: 'mean'; normalize: boolean }) => Promise<{ data: number[] }>
    >;
  }
  return extractorPromise;
}

// LangChain 的 Embeddings 抽象封装，便于后续替换成本地模型/远端 embedding 服务。
class TransformersJSEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  private async embedOne(text: string): Promise<number[]> {
    if (embeddingUnavailable) return [];
    try {
      const extractor = await getExtractor();
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data ?? []);
    } catch (e) {
      embeddingUnavailable = true;
      console.warn('[rag] embedding model unavailable, fallback to static chunks:', e);
      return [];
    }
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embedOne(text)));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embedOne(text);
  }
}

let embeddingsSingleton: TransformersJSEmbeddings | null = null;

function getEmbeddings(): TransformersJSEmbeddings {
  if (!embeddingsSingleton) embeddingsSingleton = new TransformersJSEmbeddings();
  return embeddingsSingleton;
}

// 长规则文本不能整篇直接拿去做召回，否则粒度过粗、噪音高。
// 这里使用重叠切块，让一条规则跨块边界时仍有较高概率被召回。
function chunkText(text: string, chunkSize = 700, overlap = 120): string[] {
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end));
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}

async function loadDocs(scene: OptimizeScene, roleKey: string | null): Promise<RagKnowledgeDoc[]> {
  const cfg = SCENE_CONFIG[scene];
  const sceneDir = path.join(RAG_ROOT, cfg.dir);

  const globalRulePath = path.join(RAG_ROOT, GLOBAL_RULE_FILE);
  const sceneGlobalPath = path.join(sceneDir, cfg.sceneGlobalFile);

  const [globalRuleText, sceneGlobalText, sceneFiles] = await Promise.all([
    readFile(globalRulePath, 'utf-8'),
    readFile(sceneGlobalPath, 'utf-8'),
    readdir(sceneDir),
  ]);

  const roleFiles = sceneFiles.filter(
    (name) => name.endsWith(cfg.roleSuffix) && name !== cfg.sceneGlobalFile,
  );

  const roleDocs = roleFiles.map((name) => {
    const stem = name.slice(0, -cfg.roleSuffix.length);
    const normalizedKey = normalizeRoleKey(stem);
    return {
      name,
      roleKey: normalizedKey,
      roleLabel: toRoleLabel(normalizedKey),
    };
  });

  const docs: RagKnowledgeDoc[] = [
    // 先加载全局规则：适用于所有岗位、所有场景的基本约束。
    {
      id: `${scene}:global:resume`,
      text: globalRuleText,
      source: GLOBAL_RULE_FILE,
      roleKey: null,
      roleLabel: 'Global',
      scope: 'global',
    },
    {
      // 再加载该场景的通用格式规则，例如“工作经历应该怎么写”。
      id: `${scene}:global:scene`,
      text: sceneGlobalText,
      source: path.posix.join(cfg.dir, cfg.sceneGlobalFile),
      roleKey: null,
      roleLabel: 'Global',
      scope: 'scene-global',
    },
  ];

  if (!roleKey) return docs;

  const target = roleDocs.find((x) => x.roleKey === roleKey);
  if (!target) return docs;

  // 如果岗位匹配成功，再追加一份岗位专属规则，形成 global + scene + role 三层上下文。
  const roleText = await readFile(path.join(sceneDir, target.name), 'utf-8');
  docs.push({
    id: `${scene}:role:${target.roleKey}`,
    text: roleText,
    source: path.posix.join(cfg.dir, target.name),
    roleKey: target.roleKey,
    roleLabel: target.roleLabel,
    scope: 'role',
  });

  return docs;
}

async function listRoleKeys(scene: OptimizeScene): Promise<string[]> {
  const cfg = SCENE_CONFIG[scene];
  const sceneDir = path.join(RAG_ROOT, cfg.dir);
  const sceneFiles = await readdir(sceneDir);
  return sceneFiles
    .filter((name) => name.endsWith(cfg.roleSuffix) && name !== cfg.sceneGlobalFile)
    .map((name) => normalizeRoleKey(name.slice(0, -cfg.roleSuffix.length)));
}

export async function buildSceneRetriever(scene: OptimizeScene, postType: string) {
  // 先尝试把自由文本岗位名归一化到知识库已存在的岗位 key 上。
  const roleKeys = await listRoleKeys(scene);
  const matched = matchRole(postType, roleKeys);
  const cacheKey = `${scene}:${matched?.roleKey ?? 'global'}`;

  if (!vectorStoreCache.has(cacheKey)) {
    vectorStoreCache.set(
      cacheKey,
      (async () => {
        const docs = await loadDocs(scene, matched?.roleKey ?? null);
        // 索引阶段只做一次：文档 -> 切块 -> embedding。
        const chunks = docs.flatMap((doc) => chunkText(doc.text));
        const vectors = await getEmbeddings().embedDocuments(chunks);
        return chunks.map((content, idx) => ({ content, vector: vectors[idx] || [] }));
      })(),
    );
  }

  const vectorStore = await vectorStoreCache.get(cacheKey)!;
  return {
    matchedRole: matched,
    async retrieve(rawText: string) {
      const query = `${postType}\n${rawText}`.trim();
      const hasVectors = vectorStore.some((item) => item.vector.length > 0);
      if (!hasVectors) {
        return vectorStore
          .slice(0, 5)
          .map((item) => item.content.trim())
          .filter(Boolean)
          .join('\n\n');
      }
      const queryVector = await getEmbeddings().embedQuery(query);
      if (!queryVector.length) {
        return vectorStore
          .slice(0, 5)
          .map((item) => item.content.trim())
          .filter(Boolean)
          .join('\n\n');
      }

      const scored = vectorStore
        .map((item) => ({
          content: item.content,
          score: cosineSimilarity(queryVector, item.vector),
        }))
        .sort((a, b) => b.score - a.score)
        // 这里只取 top-5，避免给 Prompt 注入过多噪音。
        .slice(0, 5);

      return scored
        .map((d) => d.content.trim())
        .filter(Boolean)
        .join('\n\n');
    },
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  // 余弦相似度是最常见的 embedding 检索打分方式；值越大，语义越接近。
  if (!a.length || !b.length) return 0;
  const size = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < size; i += 1) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function buildIndexedChunks(texts: string[], chunkSize = 700, overlap = 120): Promise<IndexedChunk[]> {
  const chunks = texts.flatMap((text) => chunkText(text, chunkSize, overlap));
  if (!chunks.length) return [];
  const vectors = await getEmbeddings().embedDocuments(chunks);
  return chunks.map((content, idx) => ({ content, vector: vectors[idx] || [] }));
}

async function retrieveTopK(store: IndexedChunk[], query: string, topK = 5): Promise<string> {
  if (!store.length) return '';
  const hasVectors = store.some((item) => item.vector.length > 0);
  if (!hasVectors) {
    return store
      .slice(0, Math.max(1, topK))
      .map((item) => item.content.trim())
      .filter(Boolean)
      .join('\n\n');
  }
  const queryVector = await getEmbeddings().embedQuery(query);
  if (!queryVector.length) {
    return store
      .slice(0, Math.max(1, topK))
      .map((item) => item.content.trim())
      .filter(Boolean)
      .join('\n\n');
  }
  return store
    .map((item) => ({
      content: item.content,
      score: cosineSimilarity(queryVector, item.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, topK))
    .map((d) => d.content.trim())
    .filter(Boolean)
    .join('\n\n');
}

const schemaGlossaryCache = new Map<string, Promise<IndexedChunk[]>>();

export async function buildSchemaGlossaryRetriever() {
  const cacheKey = 'schema:glossary';
  if (!schemaGlossaryCache.has(cacheKey)) {
    schemaGlossaryCache.set(
      cacheKey,
      (async () => {
        const glossaryPath = path.join(RAG_ROOT, SCHEMA_GLOSSARY_FILE);
        const text = await readFile(glossaryPath, 'utf-8');
        return buildIndexedChunks([text], 650, 100);
      })(),
    );
  }
  const vectorStore = await schemaGlossaryCache.get(cacheKey)!;
  return {
    async retrieve(query: string, topK = 4) {
      return retrieveTopK(vectorStore, query, topK);
    },
  };
}

export async function retrieveModifyChatKnowledge(opts: {
  userMessage: string;
  postType?: string;
  scene?: OptimizeScene | null;
  moduleContext?: string;
  includeSchema?: boolean;
  schemaTopK?: number;
}): Promise<string> {
  const parts: string[] = [];
  const queryBase = [opts.postType, opts.userMessage, opts.moduleContext?.slice(0, 1500)]
    .filter(Boolean)
    .join('\n')
    .trim();

  if (opts.includeSchema !== false) {
    try {
      const schemaRetriever = await buildSchemaGlossaryRetriever();
      const schemaCtx = await schemaRetriever.retrieve(queryBase, opts.schemaTopK ?? 4);
      if (schemaCtx) parts.push(`【JSON 字段与模块说明】\n${schemaCtx}`);
    } catch {
      /* glossary optional */
    }
  }

  if (opts.scene) {
    try {
      const sceneRetriever = await buildSceneRetriever(opts.scene, opts.postType ?? '未指定岗位');
      const sceneCtx = await sceneRetriever.retrieve(
        opts.moduleContext?.slice(0, 2000) ?? opts.userMessage,
      );
      if (sceneCtx) parts.push(`【润色规则】\n${sceneCtx}`);
      parts.push(`【描述格式（STAR + 富文本）】\n${descriptionPolishRulesForScene(opts.scene)}`);
    } catch {
      parts.push('【润色规则】未命中岗位规则，仅应用全局规则。');
      parts.push(`【描述格式（STAR + 富文本）】\n${descriptionPolishRulesForScene(opts.scene)}`);
    }
  } else if (/优化|润色|改写|描述|STAR/i.test(opts.userMessage)) {
    parts.push(`【描述格式（STAR + 富文本）】\n${descriptionPolishRulesForScene(null)}`);
  }

  return parts.join('\n\n') || '（无额外知识库上下文）';
}
