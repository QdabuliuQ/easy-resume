/** Next → CF Worker 服务端调用（密钥勿下发浏览器） */

export function cfApiBase() {
  return (process.env.CF_API_BASE_URL || '').replace(/\/$/, '');
}

/** 与 cf-api 共享；优先 CF_API_SECRET，兼容已有 ADMIN_SECRET */
export function cfApiSecret() {
  return process.env.CF_API_SECRET || process.env.ADMIN_SECRET || '';
}

export function cfApiHeaders(extra?: HeadersInit): HeadersInit {
  const secret = cfApiSecret();
  return {
    ...(extra || {}),
    ...(secret ? { 'X-CF-Key': secret } : {}),
  };
}
