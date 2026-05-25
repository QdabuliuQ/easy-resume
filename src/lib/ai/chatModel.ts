import { ChatOpenAI } from '@langchain/openai';

const CHATANYWHERE_BASE_URL = 'https://api.chatanywhere.tech/v1';
const DEFAULT_MODEL = 'deepseek-v4-flash';

export function createChatModel(opts?: { temperature?: number }) {
  const key = process.env.CHATANYWHERE_API_KEY?.trim();
  if (!key) throw new Error('缺少 CHATANYWHERE_API_KEY');
  return new ChatOpenAI({
    apiKey: key,
    model: DEFAULT_MODEL,
    temperature: opts?.temperature ?? 0.7,
    configuration: { baseURL: CHATANYWHERE_BASE_URL },
  });
}
