import { useEffect, useState } from 'react';
import type { AIModel } from '~/utils/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ModelConfigDialogProps {
  provider: {
    id: string;
    name: string;
    provider: string;
    icon: string;
    color: string;
  };
  onClose: () => void;
  onSave: (config: Partial<AIModel>) => void;
  language: 'zh' | 'en';
  existingConfig?: Partial<AIModel>;
}

interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

export const ModelConfigDialog: React.FC<ModelConfigDialogProps> = ({
  provider,
  onClose,
  onSave,
  language,
  existingConfig,
}) => {
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || '');
  const [selectedModel, setSelectedModel] = useState(existingConfig?.model || '');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState(existingConfig?.apiEndpoint || '');

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // 获取默认的 API 端点
  const getDefaultEndpoint = (providerType: string): string => {
    const endpoints: Record<string, string> = {
      gemini: 'https://generativelanguage.googleapis.com/v1',
      deepseek: 'https://api.deepseek.com/v1',
    };
    return endpoints[providerType] || '';
  };

  // 获取模型列表
  const fetchModels = async () => {
    if (!apiKey.trim()) {
      return;
    }

    setIsLoadingModels(true);
    setTestResult(null);

    try {
      const endpoint = apiEndpoint || getDefaultEndpoint(provider.provider);
      let modelsList: ModelInfo[] = [];

      // 根据不同的提供商获取模型列表
      switch (provider.provider) {
        case 'deepseek':
          modelsList = await fetchDeepSeekModels(endpoint, apiKey);
          break;
        case 'gemini':
          modelsList = await fetchGeminiModels();
          break;
        default:
          // 默认使用 OpenAI 兼容的 API
          modelsList = await fetchOpenAICompatibleModels(endpoint, apiKey);
      }

      setModels(modelsList);
      if (modelsList.length > 0 && !selectedModel) {
        setSelectedModel(modelsList[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setTestResult({
        success: false,
        message: t('获取模型列表失败', 'Failed to fetch models'),
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  // DeepSeek 模型获取
  const fetchDeepSeekModels = async (endpoint: string, key: string): Promise<ModelInfo[]> => {
    const response = await fetch(`${endpoint}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.data.map((m: any) => ({
      id: m.id,
      name: m.id,
      description: m.id,
    }));
  };







  // Gemini 模型获取
  const fetchGeminiModels = async (): Promise<ModelInfo[]> => {
    return [
      { id: 'gemini-pro', name: 'Gemini Pro', description: '通用模型' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', description: '视觉模型' },
    ];
  };



  // OpenAI 兼容 API 模型获取
  const fetchOpenAICompatibleModels = async (endpoint: string, key: string): Promise<ModelInfo[]> => {
    const response = await fetch(`${endpoint}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.data.map((m: any) => ({
      id: m.id,
      name: m.id,
      description: '',
    }));
  };

  // 测试连接
  const testConnection = async () => {
    if (!apiKey.trim() || !selectedModel) {
      setTestResult({
        success: false,
        message: t('请先获取模型列表', 'Please fetch models first'),
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const endpoint = apiEndpoint || getDefaultEndpoint(provider.provider);
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: t('连接成功！', 'Connection successful!'),
        });
      } else {
        const error = await response.text();
        setTestResult({
          success: false,
          message: t('连接失败', 'Connection failed') + `: ${error}`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: t('连接失败', 'Connection failed') + `: ${(error as Error).message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 保存配置
  const handleSave = () => {
    if (!apiKey.trim() || !selectedModel) {
      return;
    }

    onSave({
      provider: provider.provider as any,
      apiKey,
      model: selectedModel,
      apiEndpoint: apiEndpoint || getDefaultEndpoint(provider.provider),
    });
  };

  // 过滤模型列表
  const filteredModels = models.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
      <div className="w-full max-w-2xl overflow-auto rounded-2xl border border-border bg-white text-card-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
              style={{ backgroundColor: `${provider.color}15` }}
            >
              {provider.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{provider.name}</h2>
              <p className="text-xs text-muted-foreground">
                {t('提供商', 'Provider')} / {provider.name}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <span className="text-xl">×</span>
          </Button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* API 密钥 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              API {t('密钥', 'Key')}
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t('输入 API 密钥', 'Enter API key')}
              />
              <Button
                onClick={fetchModels}
                disabled={!apiKey.trim() || isLoadingModels}
                variant="primary"
              >
                {isLoadingModels ? t('获取中...', 'Loading...') : t('获取模型列表', 'Fetch models')}
              </Button>
            </div>
            <span className="mt-1 inline-block text-xs text-muted-foreground">
              {t('请确保使用有效的 API 密钥', 'Make sure your API key is valid')}
            </span>
          </div>

          {/* 自定义端点（可选） */}
          {provider.provider === 'custom' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                API {t('端点', 'Endpoint')}
              </label>
              <Input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1"
              />
            </div>
          )}

          {/* 模型选择 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t('选择模型', 'Select Model')}
            </label>
            <div className="relative">
              <Input
                type="text"
                value={searchQuery || selectedModel}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowModelDropdown(true)}
                placeholder={t('搜索模型', 'Search models')}
                disabled={models.length === 0}
              />
              {showModelDropdown && filteredModels.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-[70vh] w-full overflow-auto rounded-lg border border-border bg-white shadow-lg">
                  {filteredModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setSearchQuery('');
                        setShowModelDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <div className="font-medium text-foreground">{model.name}</div>
                      {model.description && (
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {models.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('请先输入 API 密钥并获取模型列表', 'Please enter API key and fetch models first')}
              </p>
            )}
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div
              className={`p-3 rounded-md text-sm ${
                testResult.success
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {testResult.message}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button
            onClick={testConnection}
            disabled={!selectedModel || isTesting}
            variant="secondary"
          >
            {isTesting ? t('测试中...', 'Testing...') : t('测试连接', 'Test Connection')}
          </Button>

          <div className="flex gap-2">
            <Button onClick={onClose} variant="ghost">
              {t('取消', 'Cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!apiKey.trim() || !selectedModel}>
              {t('保存', 'Save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
