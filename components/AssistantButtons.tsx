import React from 'react';
import { useAssistantStore } from '~/stores/assistantStore';
import { useChatStore } from '~/stores/chatStore';
import { useModelStore } from '~/stores/modelStore';
import { usePageContent } from '~/hooks/usePageContent';
import { useDebugStore } from '~/stores/debugStore';
import { Button } from './ui/button';
import { nanoid } from 'nanoid';
import type { Assistant } from '~/utils/storage';

const AssistantButtons: React.FC = () => {
  const { enabledAssistants } = useAssistantStore();
  const { messages, isLoading, streamResponse } = useChatStore();
  const { selectedModel } = useModelStore();
  const { extract } = usePageContent();
  const { setContext } = useDebugStore();

  if (enabledAssistants.length === 0 || messages.length > 0) {
    return null;
  }

  const handleAssistantClick = async (assistant: Assistant) => {
    const pageContent = await extract();
    if (!pageContent) {
      alert('Failed to extract page content');
      return;
    }

    const userPromptContent = assistant.userPrompt.replace(
      /\{\{content\}\}/g,
      pageContent.textContent
    );

    const systemMessage = {
      id: nanoid(),
      role: 'system' as const,
      content: assistant.systemPrompt,
      timestamp: Date.now(),
    };

    const userMessage = {
      id: nanoid(),
      role: 'user' as const,
      content: userPromptContent,
      timestamp: Date.now(),
    };

    setContext(`System: ${systemMessage.content}\n\nUser: ${userMessage.content}`);

    await streamResponse(
      selectedModel!,
      [systemMessage, userMessage],
      [systemMessage],
      'Failed to process with assistant',
      { pageTitle: pageContent.title, pageUrl: window.location.href, assistantName: assistant.name }
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {enabledAssistants.map((assistant) => (
        <Button
          key={assistant.id}
          variant="secondary"
          size="sm"
          disabled={isLoading || !selectedModel}
          onClick={() => handleAssistantClick(assistant)}
          className="rounded-full border border-primary/40 bg-primary/5 text-primary hover:-translate-y-[1px] hover:border-primary/60 hover:bg-primary/10 hover:shadow-sm transition"
          aria-label={`Run assistant ${assistant.name}`}
        >
          <span className="text-base">{assistant.icon}</span>
          <span className="text-xs font-medium">{assistant.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default AssistantButtons;
