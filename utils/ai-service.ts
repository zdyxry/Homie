// AI API service
import axios, { type AxiosInstance } from 'axios';
import type { AIModel, ChatMessage } from './storage';

export interface StreamCallback {
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface TruncationInfo {
  wasTruncated: boolean;
  originalLength: number;
  truncatedLength: number;
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

  /**
   * 检查错误是否是 token 超限错误
   */
  private isTokenLimitError(error: any): boolean {
    const errorMessage = error?.message || error?.response?.data?.error?.message || '';
    const errorString = String(errorMessage).toLowerCase();
    return (
      errorString.includes('token') ||
      errorString.includes('context length') ||
      errorString.includes('too long') ||
      errorString.includes('maximum') ||
      errorString.includes('exceeds') ||
      errorString.includes('context window')
    );
  }

  /**
   * 截断消息内容，保留开头和结尾，中间用省略号代替
   */
  private truncateMessages(messages: ChatMessage[], targetLength: number): { messages: ChatMessage[]; info: TruncationInfo } {
    // 估算当前总长度（简单按字符数估算，实际 token 数会更少）
    const totalContent = messages.map(m => m.content).join('');
    const originalLength = totalContent.length;

    if (originalLength <= targetLength) {
      return { messages, info: { wasTruncated: false, originalLength, truncatedLength: originalLength } };
    }

    // 找到最长的 user/system 消息进行截断（保留 system 消息，因为通常包含指令）
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) {
      // 如果没有 user 消息，直接返回原消息
      return { messages, info: { wasTruncated: false, originalLength, truncatedLength: originalLength } };
    }

    // 找到最长的 user 消息进行截断
    const longestUserMessage = userMessages.reduce((prev, current) =>
      prev.content.length > current.content.length ? prev : current
    );

    const otherContentLength = originalLength - longestUserMessage.content.length;
    const availableLength = Math.max(targetLength - otherContentLength, 1000); // 至少保留 1000 字符给最长的消息

    if (availableLength >= longestUserMessage.content.length) {
      return { messages, info: { wasTruncated: false, originalLength, truncatedLength: originalLength } };
    }

    // 截断策略：保留开头 60%，保留结尾 30%，中间用省略号
    const headRatio = 0.6;
    const tailRatio = 0.3;
    const headLength = Math.floor(availableLength * headRatio);
    const tailLength = Math.floor(availableLength * tailRatio);

    const content = longestUserMessage.content;
    const head = content.slice(0, headLength);
    const tail = content.slice(-tailLength);

    const truncatedContent = `${head}\n\n...[内容已截断，中间部分省略]...\n\n${tail}`;

    // 创建新的消息数组，替换被截断的消息
    const truncatedMessages = messages.map(m =>
      m.id === longestUserMessage.id ? { ...m, content: truncatedContent } : m
    );

    const truncatedTotalLength = otherContentLength + truncatedContent.length;

    return {
      messages: truncatedMessages,
      info: {
        wasTruncated: true,
        originalLength,
        truncatedLength: truncatedTotalLength,
      },
    };
  }

  async chat(messages: ChatMessage[]): Promise<{ content: string; truncationInfo?: TruncationInfo }> {
    let currentMessages = messages;
    let truncationInfo: TruncationInfo | undefined;
    let attemptCount = 0;
    const maxAttempts = 2; // 最多尝试 2 次：原始长度 -> 截断后

    while (attemptCount < maxAttempts) {
      const formattedMessages = currentMessages.map((msg) => ({
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

        return {
          content: response.data.choices[0].message.content,
          truncationInfo,
        };
      } catch (error: any) {
        // 如果是 token 超限错误且是第一次尝试，则截断后重试
        if (this.isTokenLimitError(error) && attemptCount === 0) {
          console.log('Token limit exceeded, attempting to truncate content...');
          const { messages: truncatedMessages, info } = this.truncateMessages(messages, 8000); // 目标长度 8000 字符

          // 如果截断后长度没有变化，说明无法截断，直接抛出错误
          if (!info.wasTruncated) {
            throw this.formatError(error);
          }

          currentMessages = truncatedMessages;
          truncationInfo = info;
          attemptCount++;

          // 继续循环，使用截断后的消息重试
          continue;
        }

        // 其他错误或重试后仍失败
        throw this.formatError(error);
      }
    }

    // 理论上不会执行到这里
    throw new Error('Unexpected error in chat');
  }

  /**
   * 格式化错误信息，提取友好的错误消息
   */
  private formatError(error: any): Error {
    let errorMessage = '请求失败';

    if (error.response) {
      // HTTP 错误响应
      const status = error.response.status;
      const data = error.response.data;
      const apiError = data?.error?.message || data?.message || data?.detail;

      if (apiError) {
        errorMessage = apiError;
      } else {
        errorMessage = `请求失败 (HTTP ${status})`;
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      errorMessage = '无法连接到 AI 服务，请检查网络连接';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return new Error(errorMessage);
  }

  async *chatStream(
    messages: ChatMessage[],
    signal?: AbortSignal
  ): AsyncGenerator<{ token?: string; truncationInfo?: TruncationInfo; error?: Error }> {
    let currentMessages = messages;
    let attemptCount = 0;
    const maxAttempts = 2;

    while (attemptCount < maxAttempts) {
      const formattedMessages = currentMessages.map((msg) => ({
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
          let errorData: any = null;
          try {
            errorData = await response.json();
          } catch {
            // 无法解析错误响应
          }

          const apiError = errorData?.error?.message || errorData?.message || errorData?.detail;

          // 检测 token 超限错误
          if (this.isTokenLimitError({ message: apiError }) && attemptCount === 0) {
            console.log('Token limit exceeded in stream, attempting to truncate content...');
            const { messages: truncatedMessages, info } = this.truncateMessages(messages, 8000);

            if (info.wasTruncated) {
              currentMessages = truncatedMessages;
              attemptCount++;
              // 发送截断信息
              yield { truncationInfo: info };
              // 继续循环，使用截断后的消息重试
              continue;
            }
          }

          throw new Error(apiError || `HTTP error! status: ${response.status}`);
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
                  yield { token: content };
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }

        // 成功完成
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        console.error('Streaming error:', error);
        yield { error: this.formatError(error) };
        return;
      }
    }
  }
}
