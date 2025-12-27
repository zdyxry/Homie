// AI API service
import axios, { type AxiosInstance } from 'axios';
import type { AIModel, ChatMessage } from './storage';

export interface StreamCallback {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export class AIService {
  private model: AIModel;
  private client: AxiosInstance;

  constructor(model: AIModel) {
    this.model = model;
    this.client = axios.create({
      baseURL: model.apiEndpoint || this.getDefaultEndpoint(model.provider),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${model.apiKey}`,
      },
      timeout: 60000,
    });
  }

  private getDefaultEndpoint(provider: AIModel['provider']): string {
    const endpoints = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1',
      deepseek: 'https://api.deepseek.com/v1',
      custom: '',
    };
    return endpoints[provider];
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await this.client.post('/chat/completions', {
        model: this.model.model,
        messages: formattedMessages,
        temperature: this.model.temperature || 0.7,
        max_tokens: this.model.maxTokens || 2000,
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI API error:', error);
      throw error;
    }
  }

  async *chatStream(messages: ChatMessage[], signal?: AbortSignal): AsyncGenerator<string> {
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await fetch(
        `${this.model.apiEndpoint || this.getDefaultEndpoint(this.model.provider)}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.model.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model.model,
            messages: formattedMessages,
            temperature: this.model.temperature || 0.7,
            max_tokens: this.model.maxTokens || 2000,
            stream: true,
          }),
          signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done || signal?.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error('Streaming error:', error);
      throw error;
    }
  }
}
