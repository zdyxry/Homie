import { describe, it, expect } from 'vitest';
import { classifyError, AIErrorType } from './ai-errors';

describe('classifyError', () => {
  it('should classify auth errors', () => {
    const error = classifyError('Invalid API key', 401);
    expect(error.type).toBe(AIErrorType.AUTH_ERROR);
    expect(error.statusCode).toBe(401);
  });

  it('should classify rate limit errors', () => {
    const error = classifyError('Rate limit exceeded', 429);
    expect(error.type).toBe(AIErrorType.RATE_LIMIT);
    expect(error.statusCode).toBe(429);
  });

  it('should classify token limit errors', () => {
    const error = classifyError('Context length exceeded', 400);
    expect(error.type).toBe(AIErrorType.TOKEN_LIMIT);
    expect(error.statusCode).toBe(400);
  });

  it('should classify timeout errors', () => {
    const error = classifyError('Request timeout', 408);
    expect(error.type).toBe(AIErrorType.TIMEOUT);
  });

  it('should classify network errors by status', () => {
    const error = classifyError('Internal server error', 503);
    expect(error.type).toBe(AIErrorType.NETWORK);
  });

  it('should classify unknown errors', () => {
    const error = classifyError('Something went wrong');
    expect(error.type).toBe(AIErrorType.UNKNOWN);
  });
});
