import React from 'react';
import { useChatStore } from '~/stores/chatStore';
import { useAssistantStore } from '~/stores/assistantStore';
import { useModelStore } from '~/stores/modelStore';
import { usePageContent } from '~/hooks/usePageContent';
import { useDebugStore } from '~/stores/debugStore';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { nanoid } from 'nanoid';

const EmptyState: React.FC = () => {
  const { selectedModel } = useModelStore();
  const { enabledAssistants } = useAssistantStore();
  const { messages, isLoading, streamResponse, setInputValue } = useChatStore();
  const { extract } = usePageContent();
  const { setContext } = useDebugStore();

  const handleSummarize = async () => {
    const pageContent = await extract();
    if (!pageContent) {
      alert('Failed to extract page content');
      return;
    }

    const systemMessage = {
      id: nanoid(),
      role: 'system' as const,
      content: 'You are a helpful assistant that summarizes web page content.',
      timestamp: Date.now(),
    };

    const userMessage = {
      id: nanoid(),
      role: 'user' as const,
      content: `Please summarize the following content:\n\n${pageContent.textContent}`,
      timestamp: Date.now(),
    };

    setContext(`System: ${systemMessage.content}\n\nUser: ${userMessage.content}`);

    await streamResponse(
      selectedModel!,
      [systemMessage, userMessage],
      [systemMessage, userMessage],
      'Failed to summarize content',
      { pageTitle: pageContent.title, pageUrl: window.location.href, assistantName: 'Summarize' }
    );
  };

  if (messages.length > 0 || enabledAssistants.length > 0) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>Ready when you are</CardTitle>
        <CardDescription>
          Ask anything about this page or start with a quick summary.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button onClick={handleSummarize} disabled={!selectedModel || isLoading}>
          Summarize this page
        </Button>
        <Button variant="secondary" onClick={() => setInputValue('Give me a concise overview of this page')}>
          Quick prompt
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
