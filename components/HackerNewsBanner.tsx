import React from 'react';
import { useHNStore } from '~/stores/hnStore';
import { useChatStore } from '~/stores/chatStore';
import { useModelStore } from '~/stores/modelStore';
import { usePageContent } from '~/hooks/usePageContent';
import { useDebugStore } from '~/stores/debugStore';
import { nanoid } from 'nanoid';
import { cn } from '~/utils/cn';

const HackerNewsBanner: React.FC = () => {
  const { discussion, isSearching, currentUrl, fetchDiscussionText } = useHNStore();
  const { selectedModel } = useModelStore();
  const { isLoading, streamResponse } = useChatStore();
  const { extract } = usePageContent();
  const { setContext } = useDebugStore();

  if (isSearching && !discussion) {
    return (
      <div className="border-b border-border/70 bg-gray-50 px-6 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="animate-spin">⏳</span>
          <span>Searching HackerNews...</span>
        </div>
      </div>
    );
  }

  if (!discussion) return null;

  const handleAnalyze = async () => {
    if (!selectedModel) return;

    const discussionText = await fetchDiscussionText();
    if (!discussionText) {
      alert('Failed to fetch discussion comments');
      return;
    }

    const pageContent = await extract();
    const originalText = pageContent?.textContent || '无法获取原文内容';

    const analysisPrompt = `这是一个 HackerNews 的讨论串，人们在这里对一篇文章进行树状结构的讨论回复，请仔细阅读这些讨论，提炼出主要的几种观点，并引用其中你认为有价值的回复。并结合其所讨论的原文，生成一个 reading review, 包含原文的核心观点、讨论的观点、以及两者结合后的思考和分析。请使用中文输出。

讨论串:
${discussionText}

原文:
${originalText}`;

    const systemMessage = {
      id: nanoid(),
      role: 'system' as const,
      content: 'You are a helpful assistant that analyzes HackerNews discussions and generates insightful reading reviews in Chinese.',
      timestamp: Date.now(),
    };

    const userMessage = {
      id: nanoid(),
      role: 'user' as const,
      content: analysisPrompt,
      timestamp: Date.now(),
    };

    setContext(`System: ${systemMessage.content}\n\nUser: ${userMessage.content}`);

    await streamResponse(
      selectedModel,
      [systemMessage, userMessage],
      [systemMessage],
      'Failed to analyze HackerNews discussion',
      { pageTitle: pageContent?.title || 'HackerNews Discussion', pageUrl: currentUrl, assistantName: 'HN Analyzer' }
    );
  };

  return (
    <div className="border-b border-border/70 bg-orange-50 px-6 py-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔥</span>
        <div className="flex-1">
          <div className="mb-1 text-sm font-medium text-orange-900">
            HackerNews Discussion Found
          </div>
          <a
            href={discussion.discussionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-700 hover:text-orange-900 hover:underline"
          >
            {discussion.title}
          </a>
          <div className="mt-1 flex items-center gap-3 text-xs text-orange-600">
            <span>👍 {discussion.points} points</span>
            <span>💬 {discussion.numComments} comments</span>
            <span>by {discussion.author}</span>
            <span
              className={cn(
                'cursor-pointer hover:text-orange-900 hover:underline font-medium',
                (isLoading || !selectedModel) && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => {
                if (!isLoading && selectedModel) {
                  handleAnalyze();
                }
              }}
            >
              🤖 分析讨论内容
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackerNewsBanner;
