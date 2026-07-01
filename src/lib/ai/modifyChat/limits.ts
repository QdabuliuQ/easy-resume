export const MODIFY_CHAT_MAX_BODY_BYTES = 512 * 1024;
export const MODIFY_CHAT_MAX_RESUME_BYTES = 384 * 1024;

function jsonByteSize(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

export function getModifyChatBodySizeError(
  body: unknown,
  parsed?: { resume?: unknown },
): string | null {
  if (body !== undefined && body !== null) {
    const bodyBytes = jsonByteSize(body);
    if (bodyBytes > MODIFY_CHAT_MAX_BODY_BYTES) {
      return `请求体过大，最大允许 ${MODIFY_CHAT_MAX_BODY_BYTES / 1024}KB`;
    }
  }
  if (parsed?.resume !== undefined) {
    const resumeBytes = jsonByteSize(parsed.resume);
    if (resumeBytes > MODIFY_CHAT_MAX_RESUME_BYTES) {
      return `简历数据过大，最大允许 ${MODIFY_CHAT_MAX_RESUME_BYTES / 1024}KB`;
    }
  }
  return null;
}
