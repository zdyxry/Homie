import type { AIModel, ChatMessage } from '~/storage/types';
import { parseSSEStream } from './sse-parser';
import { AIError, classifyError } from './ai-errors';

export { AIError, AIErrorType } from './ai-errors';

export class AIService {
  private model: AIModel;

  constructor(model: AIModel) {
    this.model = model;
  }

  private getEndpoint(): string {
    if (this.model.apiEndpoint) return this.model.apiEndpoint;

    const endpoints: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      deepseek: 'https://api.deepseek.com/v1',
      custom: '',
    };
    return endpoints[this.model.provider] || '';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.model.apiKey}`,
    };
  }

  private getBody(messages: ChatMessage[], stream = false): string {
    return JSON.stringify({
      model: this.model.model,
      messages: messages.map((msg) => ({ role: msg.role, content: msg.content })),
      temperature: this.model.temperature ?? 0.7,
      max_tokens: this.model.maxTokens ?? 2000,
      stream,
    });
  }

  private async request(path: string, body: string, signal?: AbortSignal): Promise<Response> {
    const endpoint = this.getEndpoint();
    if (!endpoint) {
      throw new AIError('UNKNOWN' as any, 'No API endpoint configured for this model');
    }

    return fetch(`${endpoint}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body,
      signal,
    });
  }

  private async handleError(response: Response): Promise<never> {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      const apiError = errorData.error?.message || errorData.message || errorData.detail;
      if (apiError) {
        errorMessage = apiError;
      }
    } catch {
      // ignore parse failure
    }
    throw classifyError(errorMessage, response.status);
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await this.request('/chat/completions', this.getBody(messages));

    if (!response.ok) {
      await this.handleError(response);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  async *chatStream(messages: ChatMessage[], signal?: AbortSignal): AsyncGenerator<string> {
    const response = await this.request('/chat/completions', this.getBody(messages, true), signal);

    if (!response.ok) {
      await this.handleError(response);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new AIError('UNKNOWN' as any, 'No response body available for streaming');
    }

    try {
      yield* parseSSEStream(reader, signal);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      throw error;
    }
  }
}
