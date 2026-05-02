export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'deepseek' | 'custom';
  apiKey: string;
  apiEndpoint?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  category: 'summary' | 'translation' | 'explanation' | 'custom';
}

export interface ConversationHistory {
  id: string;
  pageTitle: string;
  pageUrl: string;
  modelName: string;
  modelId: string;
  assistantName?: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  userPrompt: string;
  enabled: boolean;
  isBuiltIn: boolean;
  isModifiedByUser?: boolean;
  createdAt: number;
  updatedAt: number;
}
