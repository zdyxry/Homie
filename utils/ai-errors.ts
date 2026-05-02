export enum AIErrorType {
  TOKEN_LIMIT = 'TOKEN_LIMIT',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTH_ERROR = 'AUTH_ERROR',
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

export class AIError extends Error {
  type: AIErrorType;
  statusCode?: number;

  constructor(type: AIErrorType, message: string, statusCode?: number) {
    super(message);
    this.name = 'AIError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

export function classifyError(errorMessage: string, statusCode?: number): AIError {
  const msg = errorMessage.toLowerCase();

  if (statusCode === 401 || statusCode === 403 || msg.includes('unauthorized') || msg.includes('invalid api key')) {
    return new AIError(AIErrorType.AUTH_ERROR, 'API 密钥无效或已过期，请检查模型配置。', statusCode);
  }

  if (statusCode === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
    return new AIError(AIErrorType.RATE_LIMIT, '请求过于频繁，请稍后再试。', statusCode);
  }

  if (statusCode === 408 || msg.includes('timeout')) {
    return new AIError(AIErrorType.TIMEOUT, '请求超时，请检查网络连接或稍后重试。', statusCode);
  }

  if (
    msg.includes('token') ||
    msg.includes('context length') ||
    msg.includes('too long') ||
    msg.includes('maximum') ||
    msg.includes('exceeds')
  ) {
    return new AIError(
      AIErrorType.TOKEN_LIMIT,
      `内容长度超出模型限制：${errorMessage}\n\n建议：请尝试使用支持更大上下文的模型，或缩短页面内容。`,
      statusCode
    );
  }

  if (statusCode === 500 || statusCode === 502 || statusCode === 503) {
    return new AIError(AIErrorType.NETWORK, `服务端错误 (${statusCode})，请稍后重试。`, statusCode);
  }

  return new AIError(AIErrorType.UNKNOWN, errorMessage, statusCode);
}
