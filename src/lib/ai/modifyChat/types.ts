import type { ModifyChatDataBlock, ModifyChatProtocolEnvelope } from './protocol';

export type ModifyChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ModifyChatIntent = 'chat' | 'modify_resume';

export type ModifyChatResult = {
  intent: ModifyChatIntent;
  code: number;
  message: string;
  data: ModifyChatDataBlock[];
  content: string;
  resume?: unknown;
  protocol: ModifyChatProtocolEnvelope;
};
