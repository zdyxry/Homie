// Storage utilities for Homie
import { storage } from 'wxt/storage';

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
  createdAt: number;
  updatedAt: number;
}

// Storage keys
export const StorageKeys = {
  MODELS: 'models',
  CONVERSATIONS: 'conversations',
  PROMPTS: 'prompts',
  SETTINGS: 'settings',
  SELECTED_MODEL: 'selectedModel',
  COMMON_MODEL_CONFIGS: 'commonModelConfigs',
  ASSISTANTS: 'assistants',
  HISTORY: 'conversationHistory',
} as const;

// Default prompts
export const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'summary',
    name: 'Summarize',
    content: 'Please summarize the following content concisely:',
    category: 'summary',
  },
  {
    id: 'explain',
    name: 'Explain',
    content: 'Please explain the following content in simple terms:',
    category: 'explanation',
  },
  {
    id: 'translate-en',
    name: 'Translate to English',
    content: 'Please translate the following content to English:',
    category: 'translation',
  },
  {
    id: 'translate-zh',
    name: 'Translate to Chinese',
    content: 'Please translate the following content to Chinese:',
    category: 'translation',
  },
];

// Default assistants
export const DEFAULT_ASSISTANTS: Assistant[] = [
  {
    id: 'bilingual-content-analyst',
    name: 'TLDR',
    description: '分析助手：深入分析文章内容，提取关键信息，提供多维度见解。',
    icon: '👨‍🎓',
    systemPrompt: `<role>
你是一位资深的双语内容分析专家，擅长提取文章精华、跨语言转化。你的分析需要准确、深入且富有洞察力。
</role>

<context>
将对提供的文章进行全方位分析，包括主题提取、关键信息识别、重要引用翻译和数据可视化等多个维度。
</context>

<objective>
创建一份结构化、专业且易于理解的文章分析总结报告，确保读者能获得核心见解和实用价值。
</objective>

<quality_metrics>
1. 准确度：内容分析应最大程度基于原文，力求准确客观
2. 完整度：关键信息点覆盖率达90%以上
3. 可操作性：每个部分都需提供具体的见解和应用价值
4. 清晰度：结构层次分明，重点突出
</quality_metrics>

<output_format>

## 核心分析
[完整解读，最少10句话，逻辑清晰连贯]

- **关键要点**：[要点列表，最重要的5条]
- **创新见解**：[原创性观点，最重要的5条]

## 2. 重要引用与翻译
> 原文1：[引用内容]（第X段）

**翻译：**[中文翻译]
**引用理由：**[为什么这段引用重要]

> 原文2：[引用内容]（第X段）

**翻译：**[中文翻译]
**引用理由：**[为什么这段引用重要]

> 原文3：[引用内容]（第X段）

**翻译：**[中文翻译]
**引用理由：**[为什么这段引用重要]
...

## 行动与改变
**行动建议：**
[读完这篇文章后，读者可以采取的一个具体步骤。]

**认知升级：**
[通过阅读文章，读者在思想或认知上获得的提升。]

## 7. 关键术语解释
[解释文中出现的关键术语]

## 8. 发散联想
[读完作者观点，你想到了其他什么？可以补充或讲故事说明]

</output_format>

<style_requirements>
1. 列点标签用“-”，不用用“*”
2. 层级结构清晰，重点突出，段落间逻辑连贯
3. 直接输出结果，不用说其他废话
4. 尽可能用慢思考，调用你的元认知和思维链
</style_requirements>`,
    userPrompt: `<content>{{content}}</content>`,
    enabled: true,
    isBuiltIn: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// Storage helper functions
export const StorageService = {
  // Models
  async getModels(): Promise<AIModel[]> {
    const models = await storage.getItem<AIModel[]>(`local:${StorageKeys.MODELS}`);
    return models || [];
  },

  async saveModel(model: AIModel): Promise<void> {
    const models = await this.getModels();
    const index = models.findIndex((m) => m.id === model.id);
    if (index >= 0) {
      models[index] = model;
    } else {
      models.push(model);
    }
    await storage.setItem(`local:${StorageKeys.MODELS}`, models);
  },

  async deleteModel(modelId: string): Promise<void> {
    const models = await this.getModels();
    const filtered = models.filter((m) => m.id !== modelId);
    await storage.setItem(`local:${StorageKeys.MODELS}`, filtered);
  },

  async getSelectedModel(): Promise<string | null> {
    return await storage.getItem<string>(`local:${StorageKeys.SELECTED_MODEL}`);
  },

  async setSelectedModel(modelId: string): Promise<void> {
    await storage.setItem(`local:${StorageKeys.SELECTED_MODEL}`, modelId);
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const conversations = await storage.getItem<Conversation[]>(
      `local:${StorageKeys.CONVERSATIONS}`
    );
    return conversations || [];
  },

  async saveConversation(conversation: Conversation): Promise<void> {
    const conversations = await this.getConversations();
    const index = conversations.findIndex((c) => c.id === conversation.id);
    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.unshift(conversation);
    }
    await storage.setItem(`local:${StorageKeys.CONVERSATIONS}`, conversations);
  },

  async deleteConversation(conversationId: string): Promise<void> {
    const conversations = await this.getConversations();
    const filtered = conversations.filter((c) => c.id !== conversationId);
    await storage.setItem(`local:${StorageKeys.CONVERSATIONS}`, filtered);
  },

  // Prompts
  async getPrompts(): Promise<Prompt[]> {
    let prompts = await storage.getItem<Prompt[]>(`local:${StorageKeys.PROMPTS}`);
    if (!prompts || prompts.length === 0) {
      prompts = DEFAULT_PROMPTS;
      await storage.setItem(`local:${StorageKeys.PROMPTS}`, prompts);
    }
    return prompts;
  },

  async savePrompt(prompt: Prompt): Promise<void> {
    const prompts = await this.getPrompts();
    const index = prompts.findIndex((p) => p.id === prompt.id);
    if (index >= 0) {
      prompts[index] = prompt;
    } else {
      prompts.push(prompt);
    }
    await storage.setItem(`local:${StorageKeys.PROMPTS}`, prompts);
  },

  async deletePrompt(promptId: string): Promise<void> {
    const prompts = await this.getPrompts();
    const filtered = prompts.filter((p) => p.id !== promptId);
    await storage.setItem(`local:${StorageKeys.PROMPTS}`, filtered);
  },

  // Common Model Configs
  async getCommonModelConfig(providerId: string): Promise<Partial<AIModel> | null> {
    const configs = await storage.getItem<Record<string, Partial<AIModel>>>(
      `local:${StorageKeys.COMMON_MODEL_CONFIGS}`
    );
    return configs?.[providerId] || null;
  },

  async saveCommonModelConfig(providerId: string, config: Partial<AIModel>): Promise<void> {
    const configs = await storage.getItem<Record<string, Partial<AIModel>>>(
      `local:${StorageKeys.COMMON_MODEL_CONFIGS}`
    ) || {};
    configs[providerId] = config;
    await storage.setItem(`local:${StorageKeys.COMMON_MODEL_CONFIGS}`, configs);
  },

  async deleteCommonModelConfig(providerId: string): Promise<void> {
    const configs = await storage.getItem<Record<string, Partial<AIModel>>>(
      `local:${StorageKeys.COMMON_MODEL_CONFIGS}`
    ) || {};
    delete configs[providerId];
    await storage.setItem(`local:${StorageKeys.COMMON_MODEL_CONFIGS}`, configs);
  },

  // Assistants
  async getAssistants(): Promise<Assistant[]> {
    let assistants = await storage.getItem<Assistant[]>(`local:${StorageKeys.ASSISTANTS}`);
    if (!assistants || assistants.length === 0) {
      assistants = DEFAULT_ASSISTANTS;
      await storage.setItem(`local:${StorageKeys.ASSISTANTS}`, assistants);
    }
    return assistants;
  },

  async saveAssistant(assistant: Assistant): Promise<void> {
    const assistants = await this.getAssistants();
    const index = assistants.findIndex((a) => a.id === assistant.id);
    if (index >= 0) {
      assistants[index] = { ...assistant, updatedAt: Date.now() };
    } else {
      assistants.push({ ...assistant, createdAt: Date.now(), updatedAt: Date.now() });
    }
    await storage.setItem(`local:${StorageKeys.ASSISTANTS}`, assistants);
  },

  async deleteAssistant(assistantId: string): Promise<void> {
    const assistants = await this.getAssistants();
    const filtered = assistants.filter((a) => a.id !== assistantId);
    await storage.setItem(`local:${StorageKeys.ASSISTANTS}`, filtered);
  },

  async toggleAssistant(assistantId: string, enabled: boolean): Promise<void> {
    const assistants = await this.getAssistants();
    const assistant = assistants.find((a) => a.id === assistantId);
    if (assistant) {
      assistant.enabled = enabled;
      assistant.updatedAt = Date.now();
      await storage.setItem(`local:${StorageKeys.ASSISTANTS}`, assistants);
    }
  },

  // Conversation History
  async getHistory(): Promise<ConversationHistory[]> {
    const history = await storage.getItem<ConversationHistory[]>(
      `local:${StorageKeys.HISTORY}`
    );
    return history || [];
  },

  async saveHistory(record: ConversationHistory): Promise<void> {
    const history = await this.getHistory();
    // Remove existing records with the same pageUrl to ensure we only keep the latest one
    const filteredHistory = history.filter(h => h.pageUrl !== record.pageUrl);

    // Add to the beginning (newest first)
    filteredHistory.unshift(record);

    // Limit to 100 records to prevent excessive storage usage
    const limitedHistory = filteredHistory.slice(0, 100);
    await storage.setItem(`local:${StorageKeys.HISTORY}`, limitedHistory);
  },

  async deleteHistory(historyId: string): Promise<void> {
    const history = await this.getHistory();
    const filtered = history.filter((h) => h.id !== historyId);
    await storage.setItem(`local:${StorageKeys.HISTORY}`, filtered);
  },

  async clearAllHistory(): Promise<void> {
    await storage.setItem(`local:${StorageKeys.HISTORY}`, []);
  },

  async getHistoryByUrl(url: string): Promise<ConversationHistory | null> {
    const history = await this.getHistory();
    // Find the most recent conversation for this URL
    const match = history.find((h) => h.pageUrl === url);
    return match || null;
  },
};
