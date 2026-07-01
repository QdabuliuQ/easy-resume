import {
  extractResumePatch,
  extractTextFromData,
  intentFromEnvelope,
  type ModifyChatProtocolEnvelope,
} from './protocol';
import type { ModifyChatResult } from './types';

export function buildModifyChatResult(protocol: ModifyChatProtocolEnvelope): ModifyChatResult {
  const patch = extractResumePatch(protocol.data);
  const content = extractTextFromData(protocol.data);
  return {
    intent: intentFromEnvelope(protocol),
    code: protocol.code,
    message: protocol.message,
    data: protocol.data ?? [],
    content,
    resume: patch?.props.newResumeJson,
    protocol,
  };
}
