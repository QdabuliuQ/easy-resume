/** 流式阶段标记：文本总结结束、组件数据开始 */
export const MODIFY_CHAT_DATA_START = '/*---DataStart---*/';
export const MODIFY_CHAT_DATA_END = '/*---DataEnd---*/';

export type ModifyChatTextBlock = {
  type: 'text';
  content: string;
};

export type ModifyChatResumePatchProps = {
  newResumeJson: unknown;
};

export type ModifyChatCustomBlock = {
  type: 'custom-component';
  componentName: 'resume-patch';
  props: ModifyChatResumePatchProps;
};

export type ModifyChatDataBlock = ModifyChatTextBlock | ModifyChatCustomBlock;

export type ModifyChatProtocolEnvelope = {
  code: number;
  message: string;
  done?: boolean;
  streaming?: boolean;
  phase?: 'text' | 'component';
  marker?: typeof MODIFY_CHAT_DATA_START | typeof MODIFY_CHAT_DATA_END;
  meta?: {
    status?: 'classifying' | 'resolving_scope' | 'generating_resume' | 'parsing' | 'retry';
    attempt?: number;
    intent?: 'chat' | 'modify_resume';
    progressBytes?: number;
  };
  data?: ModifyChatDataBlock[];
  error?: string;
};

export function streamingTextEnvelope(content: string): ModifyChatProtocolEnvelope {
  return {
    code: 0,
    message: 'success',
    streaming: true,
    phase: 'text',
    data: [{ type: 'text', content }],
  };
}

export function statusEnvelope(
  status: 'classifying' | 'resolving_scope' | 'generating_resume' | 'parsing' | 'retry',
  attempt?: number,
  progressBytes?: number,
): ModifyChatProtocolEnvelope {
  return {
    code: 0,
    message: 'success',
    meta: { status, attempt, progressBytes },
  };
}

export function intentEnvelope(intent: 'chat' | 'modify_resume'): ModifyChatProtocolEnvelope {
  return {
    code: 0,
    message: 'success',
    meta: { intent },
  };
}

export function textOnlyDoneEnvelope(content: string): ModifyChatProtocolEnvelope {
  return {
    code: 0,
    message: 'success',
    done: true,
    phase: 'text',
    data: [{ type: 'text', content }],
  };
}

export function resumePatchDoneEnvelope(
  text: string,
  newResumeJson: unknown,
): ModifyChatProtocolEnvelope {
  return {
    code: 0,
    message: 'success',
    done: true,
    phase: 'component',
    marker: MODIFY_CHAT_DATA_END,
    data: [
      { type: 'text', content: text },
      {
        type: 'custom-component',
        componentName: 'resume-patch',
        props: { newResumeJson },
      },
    ],
  };
}

export function errorEnvelope(msg: string): ModifyChatProtocolEnvelope {
  return { code: 1, message: msg, error: msg };
}

export function dataStartEnvelope(): ModifyChatProtocolEnvelope {
  return {
    code: 0,
    message: 'success',
    phase: 'component',
    marker: MODIFY_CHAT_DATA_START,
  };
}

export function extractTextFromData(data: ModifyChatDataBlock[] | undefined): string {
  if (!data?.length) return '';
  return data.filter((b): b is ModifyChatTextBlock => b.type === 'text').map((b) => b.content).join('\n').trim();
}

export function extractResumePatch(data: ModifyChatDataBlock[] | undefined): ModifyChatCustomBlock | null {
  if (!data?.length) return null;
  const block = data.find(
    (b): b is ModifyChatCustomBlock => b.type === 'custom-component' && b.componentName === 'resume-patch',
  );
  return block ?? null;
}

export function intentFromEnvelope(env: ModifyChatProtocolEnvelope): 'chat' | 'modify_resume' {
  if (env.meta?.intent) return env.meta.intent;
  return extractResumePatch(env.data) ? 'modify_resume' : 'chat';
}
