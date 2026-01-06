import { useState, useEffect } from 'react';
import { StorageService, type AIModel, type Assistant } from '~/utils/storage';
import { nanoid } from 'nanoid';
import { ModelConfigDialog } from '~/components/ModelConfigDialog';
import { AssistantEditor } from '~/components/AssistantEditor';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Select } from '~/components/ui/select';
import { Badge } from '~/components/ui/badge';
import { Switch } from '~/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { HistoryTab } from '~/components/HistoryTab';

// 预定义的通用模型配置
const COMMON_MODELS = [
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'gemini',
    icon: <img src="/icons/gemini.svg" alt="Gemini" className="homie-h-5 homie-w-5 homie-object-contain" />,
    color: '#4285F4'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'deepseek',
    icon: <img src="/icons/deepseek.svg" alt="DeepSeek" className="homie-h-5 homie-w-5 homie-object-contain" />,
    color: '#1890ff'
  },
];

const OptionsApp = () => {
  const [activeTab, setActiveTab] = useState<'models' | 'assistants' | 'history' | 'settings'>('models');
  const [models, setModels] = useState<AIModel[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [configuringProvider, setConfiguringProvider] = useState<typeof COMMON_MODELS[0] | null>(null);
  const [commonModelConfigs, setCommonModelConfigs] = useState<Record<string, Partial<AIModel>>>({});
  const [perParagraphCopy, setPerParagraphCopy] = useState<boolean>(true);
  const [sendKey, setSendKey] = useState<'enter' | 'ctrl-enter'>('ctrl-enter');
  const [autoFocusInput, setAutoFocusInput] = useState<boolean>(true);

  useEffect(() => {
    loadData();
    loadCommonModelConfigs();
  }, []);

  const loadData = async () => {
    const [loadedModels, loadedAssistants] = await Promise.all([
      StorageService.getModels(),
      StorageService.getAssistants(),
      StorageService.getSelectedModel(),
    ]);
    setModels(loadedModels);
    setAssistants(loadedAssistants);

    // Load settings
    const ppc = await StorageService.getSetting<boolean>('perParagraphCopy', true);
    setPerParagraphCopy(ppc ?? true);
    const sk = await StorageService.getSetting<'enter' | 'ctrl-enter'>('sendKey', 'ctrl-enter');
    setSendKey(sk ?? 'ctrl-enter');
    const afi = await StorageService.getSetting<boolean>('autoFocusInput', true);
    setAutoFocusInput(afi ?? true);
  };

  const handleSetPerParagraphCopy = async (value: boolean) => {
    await StorageService.saveSetting('perParagraphCopy', value);
    setPerParagraphCopy(value);
  };

  const handleSetSendKey = async (value: 'enter' | 'ctrl-enter') => {
    await StorageService.saveSetting('sendKey', value);
    setSendKey(value);
  };

  const handleSetAutoFocusInput = async (value: boolean) => {
    await StorageService.saveSetting('autoFocusInput', value);
    setAutoFocusInput(value);
  };

  const loadCommonModelConfigs = async () => {
    // 从 storage 中加载已保存的通用模型配置
    const configs: Record<string, Partial<AIModel>> = {};
    for (const provider of COMMON_MODELS) {
      const config = await StorageService.getCommonModelConfig(provider.id);
      if (config) {
        configs[provider.id] = config;
      }
    }
    setCommonModelConfigs(configs);
  };

  const handleSaveCommonModelConfig = async (providerId: string, config: Partial<AIModel>) => {
    await StorageService.saveCommonModelConfig(providerId, config);
    setCommonModelConfigs({ ...commonModelConfigs, [providerId]: config });
    setConfiguringProvider(null);
  };

  const handleDeleteCommonModelConfig = async (providerId: string) => {
    if (confirm(language === 'zh' ? '确定要删除此配置吗？' : 'Are you sure you want to delete this configuration?')) {
      await StorageService.deleteCommonModelConfig(providerId);
      const newConfigs = { ...commonModelConfigs };
      delete newConfigs[providerId];
      setCommonModelConfigs(newConfigs);
    }
  };

  const handleSaveAssistant = async (assistant: Assistant) => {
    await StorageService.saveAssistant(assistant);
    await loadData();
    setEditingAssistant(null);
  };

  const handleToggleAssistant = async (assistantId: string, enabled: boolean) => {
    await StorageService.toggleAssistant(assistantId, enabled);
    await loadData();
  };

  const handleDeleteAssistant = async (assistantId: string) => {
    if (confirm(language === 'zh' ? '确定要删除此助手吗？' : 'Are you sure you want to delete this assistant?')) {
      await StorageService.deleteAssistant(assistantId);
      await loadData();
    }
  };

  const handleNewAssistant = () => {
    setEditingAssistant({
      id: nanoid(),
      name: language === 'zh' ? '新助手' : 'New Assistant',
      description: '',
      icon: '🤖',
      systemPrompt: '',
      userPrompt: '<content>{{content}}</content>',
      enabled: true,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  const handleSaveModel = async (model: AIModel) => {
    await StorageService.saveModel(model);
    await loadData();
    setEditingModel(null);
  };

  const handleDeleteModel = async (modelId: string) => {
    if (confirm(language === 'zh' ? '确定要删除此模型吗？' : 'Are you sure you want to delete this model?')) {
      await StorageService.deleteModel(modelId);
      await loadData();
    }
  };

  const handleNewModel = () => {
    setEditingModel({
      id: nanoid(),
      name: '',
      provider: 'openai',
      apiKey: '',
      model: 'gpt-3.5-turbo',
    });
  };

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;

  return (
    <div className="homie-min-h-screen homie-bg-gradient-to-b homie-from-slate-50 homie-via-white homie-to-slate-100 homie-text-foreground">
      <div className="homie-mx-auto homie-flex homie-max-w-6xl homie-flex-col homie-gap-6 homie-px-6 homie-py-10">
        <header className="homie-flex homie-flex-col homie-gap-4 md:homie-flex-row md:homie-items-center md:homie-justify-between">
          <div className="homie-flex homie-items-center homie-gap-3">
            <div className="homie-flex homie-h-12 homie-w-12 homie-items-center homie-justify-center homie-rounded-2xl homie-bg-primary/10 homie-text-lg homie-font-semibold homie-text-primary">
              H
            </div>
            <div>
              <p className="homie-text-xs homie-uppercase homie-tracking-[0.12em] homie-text-muted-foreground">Homie</p>
              <h1 className="homie-text-2xl homie-font-semibold">Control center</h1>
            </div>
          </div>
          <div className="homie-flex homie-items-center homie-gap-3">
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'zh' | 'en')}
              className="homie-w-44"
            >
              <option value="zh">🇨🇳 中文</option>
              <option value="en">🇬🇧 English</option>
            </Select>
            <Badge variant="secondary">v{chrome.runtime.getManifest().version}</Badge>
          </div>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'models' | 'assistants')}
          className="homie-space-y-4"
        >
          <TabsList>
            <TabsTrigger value="models">{t('模型提供商', 'Model Providers')}</TabsTrigger>
            <TabsTrigger value="assistants">{t('总结助手', 'Assistants')}</TabsTrigger>
            <TabsTrigger value="history">{t('历史记录', 'History')}</TabsTrigger>
            <TabsTrigger value="settings">{t('设置', 'Settings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="homie-border-none homie-bg-transparent homie-p-0 homie-shadow-none">
            <div className="homie-grid homie-gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('通用模型', 'Common Models')}</CardTitle>
                  <CardDescription>
                    {t('快捷配置热门提供商，随处可用。', 'Set up popular providers quickly and reuse across the extension.')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="homie-divide-y homie-divide-border">
                  {COMMON_MODELS.map((commonModel) => {
                    const isConfigured = !!commonModelConfigs[commonModel.id];
                    return (
                      <div key={commonModel.id} className="homie-flex homie-items-center homie-justify-between homie-gap-4 homie-py-3">
                        <div className="homie-flex homie-items-center homie-gap-3">
                          <div
                            className="homie-flex homie-h-9 homie-w-9 homie-items-center homie-justify-center homie-rounded-xl homie-text-lg"
                            style={{ backgroundColor: `${commonModel.color}20` }}
                          >
                            {commonModel.icon}
                          </div>
                          <div>
                            <div className="homie-text-sm homie-font-medium homie-text-foreground">{commonModel.name}</div>
                            {isConfigured && commonModelConfigs[commonModel.id]?.model && (
                              <div className="homie-text-xs homie-text-muted-foreground">
                                {commonModelConfigs[commonModel.id].model}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="homie-flex homie-items-center homie-gap-2">
                          {isConfigured && <Badge variant="secondary">{t('已配置', 'Configured')}</Badge>}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfiguringProvider(commonModel)}
                          >
                            {t('设置', 'Settings')}
                          </Button>
                          {isConfigured && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCommonModelConfig(commonModel.id)}
                            >
                              {t('删除', 'Delete')}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="homie-flex homie-flex-row homie-items-center homie-justify-between">
                  <div>
                    <CardTitle>{t('自定义模型', 'Custom Models')}</CardTitle>
                    <CardDescription>
                      {t('适配任意 OpenAI 兼容的模型服务。', 'Bring your own keys and endpoints for custom models.')}
                    </CardDescription>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleNewModel}>
                    {t('添加模型', 'Add Model')}
                  </Button>
                </CardHeader>
                <CardContent className="homie-space-y-4">
                  {editingModel && (
                    <ModelForm
                      model={editingModel}
                      onSave={handleSaveModel}
                      onCancel={() => setEditingModel(null)}
                      language={language}
                    />
                  )}

                  {models.length === 0 && !editingModel ? (
                    <div className="homie-flex homie-flex-col homie-items-center homie-justify-center homie-rounded-xl homie-border homie-border-dashed homie-border-border homie-px-6 homie-py-10 homie-text-center homie-text-muted-foreground">
                      <div className="homie-text-4xl">📦</div>
                      <p className="homie-mt-2 homie-text-sm">{t('暂无数据', 'No data')}</p>
                    </div>
                  ) : (
                    <div className="homie-divide-y homie-divide-border homie-rounded-xl homie-border homie-border-border">
                      {models.map((model) => (
                        <div key={model.id} className="homie-flex homie-items-center homie-justify-between homie-gap-4 homie-px-4 homie-py-3">
                          <div>
                            <div className="homie-flex homie-items-center homie-gap-2">
                              <span className="homie-text-sm homie-font-medium homie-text-foreground">{model.name}</span>
                              <Badge variant="outline">{model.provider}</Badge>
                            </div>
                            <div className="homie-text-xs homie-text-muted-foreground">{model.model}</div>
                          </div>
                          <div className="homie-flex homie-items-center homie-gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingModel(model)}>
                              {t('编辑', 'Edit')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteModel(model.id)}>
                              {t('删除', 'Delete')}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assistants" className="homie-border-none homie-bg-transparent homie-p-0 homie-shadow-none">
            <div className="homie-grid homie-gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('内置助手', 'Built-in Assistants')}</CardTitle>
                  <CardDescription>
                    {t('开箱即用的总结模版，可快速开启或微调。', 'Ready-made templates you can enable or tweak quickly.')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="homie-space-y-3">
                  {assistants.filter((a) => a.isBuiltIn).map((assistant) => (
                    <div
                      key={assistant.id}
                      className="homie-flex homie-items-start homie-justify-between homie-rounded-xl homie-border homie-border-border homie-px-4 homie-py-3 homie-shadow-sm"
                    >
                      <div className="homie-flex homie-flex-1 homie-items-start homie-gap-3">
                        <div className="homie-text-2xl">{assistant.icon}</div>
                        <div className="homie-space-y-1">
                          <div className="homie-flex homie-items-center homie-gap-2">
                            <h3 className="homie-font-semibold homie-text-foreground">{assistant.name}</h3>
                            <Badge variant="secondary">{t('预设', 'Preset')}</Badge>
                          </div>
                          <p className="homie-text-sm homie-text-muted-foreground">{assistant.description}</p>
                        </div>
                      </div>
                      <div className="homie-flex homie-items-center homie-gap-3">
                        <Switch
                          checked={assistant.enabled}
                          onCheckedChange={(checked) => handleToggleAssistant(assistant.id, checked)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => setEditingAssistant(assistant)}>
                          {t('设置', 'Settings')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="homie-flex homie-flex-row homie-items-center homie-justify-between">
                  <div>
                    <CardTitle>{t('自定义助手', 'Custom Assistants')}</CardTitle>
                    <CardDescription>
                      {t('创建属于你的知识小伙伴，复用模板或重写提示词。', 'Create your own helpers. Duplicate presets or craft prompts from scratch.')}
                    </CardDescription>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleNewAssistant}>
                    {t('创建', 'Create')}
                  </Button>
                </CardHeader>
                <CardContent className="homie-space-y-3">
                  {assistants.filter((a) => !a.isBuiltIn).length === 0 ? (
                    <div className="homie-flex homie-min-h-[160px] homie-flex-col homie-items-center homie-justify-center homie-rounded-xl homie-border homie-border-dashed homie-border-border homie-text-muted-foreground">
                      <div className="homie-text-4xl">🤖</div>
                      <p className="homie-mt-2 homie-text-sm">{t('暂无数据', 'No data')}</p>
                    </div>
                  ) : (
                    assistants
                      .filter((a) => !a.isBuiltIn)
                      .map((assistant) => (
                        <div
                          key={assistant.id}
                          className="homie-flex homie-items-start homie-justify-between homie-rounded-xl homie-border homie-border-border homie-px-4 homie-py-3 homie-shadow-sm"
                        >
                          <div className="homie-flex homie-flex-1 homie-items-start homie-gap-3">
                            <div className="homie-text-2xl">{assistant.icon}</div>
                            <div className="homie-space-y-1">
                              <div className="homie-flex homie-items-center homie-gap-2">
                                <h3 className="homie-font-semibold homie-text-foreground">{assistant.name}</h3>
                                {assistant.enabled ? (
                                  <Badge variant="secondary">{t('启用', 'Enabled')}</Badge>
                                ) : (
                                  <Badge variant="outline">{t('未启用', 'Disabled')}</Badge>
                                )}
                              </div>
                              <p className="homie-text-sm homie-text-muted-foreground">
                                {assistant.description || t('暂无描述', 'No description')}
                              </p>
                            </div>
                          </div>
                          <div className="homie-flex homie-items-center homie-gap-2">
                            <Switch
                              checked={assistant.enabled}
                              onCheckedChange={(checked) => handleToggleAssistant(assistant.id, checked)}
                            />
                            <Button variant="ghost" size="sm" onClick={() => setEditingAssistant(assistant)}>
                              {t('设置', 'Settings')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAssistant(assistant.id)}>
                              {t('删除', 'Delete')}
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="homie-border-none homie-bg-transparent homie-p-0 homie-shadow-none">
            <HistoryTab language={language} />
          </TabsContent>

          <TabsContent value="settings" className="homie-border-none homie-bg-transparent homie-p-0 homie-shadow-none">
            <div className="homie-grid homie-gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('常规设置', 'General')}</CardTitle>
                  <CardDescription>{t('界面与行为设置', 'UI and behavior')}</CardDescription>
                </CardHeader>
                <CardContent className="homie-space-y-6">
                  <div className="homie-flex homie-items-center homie-justify-between homie-gap-4">
                    <div className="homie-flex-1">
                      <div className="homie-font-medium">{t('段落复制按钮', 'Per-paragraph copy buttons')}</div>
                      <div className="homie-text-sm homie-text-muted-foreground">{t('在每个消息段落右上角显示复制按钮', 'Show a copy button at the top-right of each paragraph')}</div>
                    </div>
                    <div>
                      <Switch checked={perParagraphCopy} onCheckedChange={handleSetPerParagraphCopy} />
                    </div>
                  </div>
                  <div className="homie-flex homie-items-center homie-justify-between homie-gap-4">
                    <div className="homie-flex-1">
                      <div className="homie-font-medium">{t('发送消息快捷键', 'Send message shortcut')}</div>
                      <div className="homie-text-sm homie-text-muted-foreground">{t('选择用于发送消息的快捷键', 'Choose the shortcut to send messages')}</div>
                    </div>
                    <div>
                      <Select
                        value={sendKey}
                        onChange={(e) => handleSetSendKey(e.target.value as 'enter' | 'ctrl-enter')}
                        className="homie-w-44"
                      >
                        <option value="ctrl-enter">Ctrl + Enter</option>
                        <option value="enter">Enter</option>
                      </Select>
                    </div>
                  </div>
                  <div className="homie-flex homie-items-center homie-justify-between homie-gap-4">
                    <div className="homie-flex-1">
                      <div className="homie-font-medium">{t('自动聚焦输入框', 'Auto-focus input box')}</div>
                      <div className="homie-text-sm homie-text-muted-foreground">{t('打开侧边栏时自动聚焦输入框', 'Auto-focus the input box when opening the sidebar')}</div>
                    </div>
                    <div>
                      <Switch checked={autoFocusInput} onCheckedChange={handleSetAutoFocusInput} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {configuringProvider && (
        <ModelConfigDialog
          provider={configuringProvider}
          onClose={() => setConfiguringProvider(null)}
          onSave={(config) => handleSaveCommonModelConfig(configuringProvider.id, config)}
          language={language}
          existingConfig={commonModelConfigs[configuringProvider.id]}
        />
      )}

      {editingAssistant && (
        <AssistantEditor
          assistant={editingAssistant}
          onSave={handleSaveAssistant}
          onCancel={() => setEditingAssistant(null)}
          language={language}
        />
      )}
    </div>
  );
};

interface ModelFormProps {
  model: AIModel;
  onSave: (model: AIModel) => void;
  onCancel: () => void;
  language: 'zh' | 'en';
}

const ModelForm: React.FC<ModelFormProps> = ({ model: initialModel, onSave, onCancel, language }) => {
  const [model, setModel] = useState(initialModel);

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(model);
  };

  return (
    <form onSubmit={handleSubmit} className="homie-rounded-xl homie-border homie-border-border homie-bg-background/60 homie-p-4 homie-shadow-sm">
      <div className="homie-space-y-4">
        <div className="homie-space-y-2">
          <label className="homie-text-sm homie-font-medium homie-text-foreground">{t('名称', 'Name')}</label>
          <Input
            value={model.name}
            onChange={(e) => setModel({ ...model, name: e.target.value })}
            required
          />
        </div>

        <div className="homie-space-y-2">
          <label className="homie-text-sm homie-font-medium homie-text-foreground">{t('提供商', 'Provider')}</label>
          <Select
            value={model.provider}
            onChange={(e) =>
              setModel({ ...model, provider: e.target.value as AIModel['provider'] })
            }
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="deepseek">DeepSeek</option>
            <option value="custom">{t('自定义', 'Custom')}</option>
          </Select>
        </div>

        <div className="homie-space-y-2">
          <label className="homie-text-sm homie-font-medium homie-text-foreground">{t('模型', 'Model')}</label>
          <Input
            value={model.model}
            onChange={(e) => setModel({ ...model, model: e.target.value })}
            placeholder={t('例如: gpt-3.5-turbo', 'e.g. gpt-3.5-turbo')}
            required
          />
        </div>

        <div className="homie-space-y-2">
          <label className="homie-text-sm homie-font-medium homie-text-foreground">{t('API 密钥', 'API Key')}</label>
          <Input
            type="password"
            value={model.apiKey}
            onChange={(e) => setModel({ ...model, apiKey: e.target.value })}
            required
          />
        </div>

        {model.provider === 'custom' && (
          <div className="homie-space-y-2">
            <label className="homie-text-sm homie-font-medium homie-text-foreground">{t('API 端点', 'API Endpoint')}</label>
            <Input
              type="text"
              value={model.apiEndpoint || ''}
              onChange={(e) => setModel({ ...model, apiEndpoint: e.target.value })}
              placeholder="https://api.example.com/v1"
            />
          </div>
        )}
      </div>

      <div className="homie-mt-4 homie-flex homie-gap-2">
        <Button type="submit" size="sm">
          {t('保存', 'Save')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t('取消', 'Cancel')}
        </Button>
      </div>
    </form>
  );
};

export default OptionsApp;
