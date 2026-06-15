import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Embeddings } from '@langchain/core/embeddings';
import { pipeline } from '@xenova/transformers';

// 评分规则知识库目录。这里放的是“如何打分”的规则文本，而不是岗位知识。
const SCORE_RULES_DIR = path.join(process.cwd(), 'src', 'rag-resume-knowledge', 'score-rules');

type IndexedChunk = {
  // 检索命中的原始规则片段文本。
  content: string;
  // 对应 embedding 向量，用于与简历查询做相似度计算。
  vector: number[];
};

let extractorPromise: Promise<
  (text: string, opts: { pooling: 'mean'; normalize: boolean }) => Promise<{ data: number[] }>
> | null = null;

// 评分规则索引是全局共享的；同一进程内构建一次即可。
const scoreRulesIndexCache: { index?: Promise<IndexedChunk[]> } = {};

async function getExtractor() {
  if (!extractorPromise) {
    // 与场景化 RAG 共用同一个 embedding 模型，保证召回语义口径一致。
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2') as Promise<
      (text: string, opts: { pooling: 'mean'; normalize: boolean }) => Promise<{ data: number[] }>
    >;
  }
  return extractorPromise;
}

// 评分 RAG 与润色 RAG 共享同一 embedding 封装；差别只在于文档来源和 query 组织方式。
class TransformersJSEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  private async embedOne(text: string): Promise<number[]> {
    const extractor = await getExtractor();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data ?? []);
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

// 评分规则文件同样按重叠切块，保证一条较长规则不会因为被截断而召回失败。
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

async function buildScoreRulesIndex(): Promise<IndexedChunk[]> {
  // 评分规则目录中的每个 txt 文件都会被视为知识源。
  const entries = await readdir(SCORE_RULES_DIR, { withFileTypes: true });
  const txtFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.txt'));
  const docs = await Promise.all(
    txtFiles.map((entry) => readFile(path.join(SCORE_RULES_DIR, entry.name), 'utf-8')),
  );
  // 索引阶段：文件 -> 切块 -> embedding。
  const chunks = docs.flatMap((doc) => chunkText(doc));
  if (chunks.length === 0) return [];
  const vectors = await getEmbeddings().embedDocuments(chunks);
  return chunks.map((content, idx) => ({ content, vector: vectors[idx] || [] }));
}

function cosineSimilarity(a: number[], b: number[]): number {
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

export async function retrieveScoreRulesContext(resumeJson: unknown, topK = 6): Promise<string> {
  if (!scoreRulesIndexCache.index) {
    // 第一次请求时延迟构建索引，避免服务启动就做 embedding。
    scoreRulesIndexCache.index = buildScoreRulesIndex();
  }
  const index = await scoreRulesIndexCache.index;
  if (!index.length) return '';

  // 当前实现直接使用简历 JSON 作为查询语料。
  // 这样做简单但不够精细，后续可以升级为“结构化摘要 + 关键字段片段”以提高命中率。
  const query = JSON.stringify(resumeJson ?? {}).slice(0, 8000);
  const queryVector = await getEmbeddings().embedQuery(query);

  return index
    .map((item) => ({
      content: item.content,
      score: cosineSimilarity(queryVector, item.vector),
    }))
    .sort((a, b) => b.score - a.score)
    // topK 过大容易把无关规则也塞进 Prompt，影响评分稳定性。
    .slice(0, Math.max(1, topK))
    .map((item) => item.content.trim())
    .filter(Boolean)
    .join('\n\n');
}
