import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import type { Assistant } from '~/utils/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { cn } from '~/utils/cn';

interface AssistantEditorProps {
  assistant: Assistant;
  onSave: (assistant: Assistant) => void;
  onCancel: () => void;
  language: 'zh' | 'en';
}

export const AssistantEditor: React.FC<AssistantEditorProps> = ({
  assistant: initialAssistant,
  onSave,
  onCancel,
  language,
}) => {
  const [assistant, setAssistant] = useState(initialAssistant);
  const [showExample, setShowExample] = useState(false);

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const handleSave = () => {
    if (!assistant.name.trim() || !assistant.systemPrompt.trim()) {
      alert(t('请填写名称和系统提示词', 'Please fill in name and system prompt'));
      return;
    }
    onSave(assistant);
  };

  const handleAddToCustom = () => {
    if (!assistant.systemPrompt.trim()) {
      alert(t('请填写系统提示词', 'Please fill in system prompt'));
      return;
    }
    // 创建一个新的自定义助手，基于当前内置助手
    const customAssistant: Assistant = {
      ...assistant,
      id: nanoid(),
      name: assistant.name + ' ' + t('(副本)', '(Copy)'),
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onSave(customAssistant);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-white text-card-foreground shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
              {assistant.icon}
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                {t('所有助手', 'All Assistants')}
              </p>
              <h2 className="text-xl font-semibold text-foreground">
                {assistant.icon} {assistant.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {assistant.description || t('为助手添加描述以便记忆', 'Add a short description')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {assistant.isBuiltIn && <Badge variant="secondary">Built-in</Badge>}
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close">
              <span className="text-xl">×</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-border px-6 py-3">
          {assistant.isBuiltIn && (
            <Button
              onClick={handleAddToCustom}
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <span>＋</span>
              <span>{t('添加到自定义助手', 'Add to custom assistants')}</span>
            </Button>
          )}
          <Button
            onClick={() => setShowExample(!showExample)}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <span>👁️</span>
            <span>{t('查看示例', 'View example')}</span>
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          {!assistant.isBuiltIn && (
            <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-background/60 p-4 shadow-sm md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('图标', 'Icon')}
                </label>
                <Input
                  value={assistant.icon}
                  onChange={(e) => setAssistant({ ...assistant, icon: e.target.value })}
                  className="text-center text-2xl"
                  placeholder="🤖"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('名称', 'Name')}
                </label>
                <Input
                  value={assistant.name}
                  onChange={(e) => setAssistant({ ...assistant, name: e.target.value })}
                  placeholder={t('助手名称', 'Assistant name')}
                />
              </div>
              <div className="md:col-span-3">
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('描述', 'Description')}
                </label>
                <Input
                  value={assistant.description}
                  onChange={(e) => setAssistant({ ...assistant, description: e.target.value })}
                  placeholder={t('简短描述助手的功能', 'Brief description of the assistant')}
                />
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">
                {t('系统提示词', 'System Prompt')}
              </label>
              <Textarea
                value={assistant.systemPrompt}
                onChange={(e) =>
                  setAssistant({ ...assistant, systemPrompt: e.target.value })
                }
                className={cn(
                  'font-mono text-sm leading-relaxed',
                  assistant.isBuiltIn ? 'min-h-[320px]' : 'min-h-[280px]'
                )}
                placeholder={t('输入系统提示词...', 'Enter system prompt...')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">
                {t('用户提示词', 'User Prompt')}
              </label>
              <Textarea
                value={assistant.userPrompt}
                onChange={(e) =>
                  setAssistant({ ...assistant, userPrompt: e.target.value })
                }
                className={cn(
                  'font-mono text-sm leading-relaxed bg-muted/50',
                  assistant.isBuiltIn ? 'min-h-[320px]' : 'min-h-[280px]'
                )}
                placeholder={t('输入用户提示词...', 'Enter user prompt...')}
              />
              <p className="text-xs text-muted-foreground">
                {t('使用 {{content}} 作为内容占位符', 'Use {{content}} as content placeholder')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={onCancel}>
            {t('取消', 'Cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('保存', 'Save')}
          </Button>
        </div>

        {showExample && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 p-6">
            <div className="w-full max-w-2xl overflow-auto rounded-2xl border border-border bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{t('示例输出', 'Example Output')}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowExample(false)} aria-label="Close example">
                  <span className="text-xl">×</span>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('这里将显示助手的示例输出...', 'Example output will be shown here...')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
