import React, { useState, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { StorageService, type ChatMessage, type AIModel, type Assistant, type ConversationHistory } from '~/utils/storage';
import { AIService } from '~/utils/ai-service';
import { extractPageContent } from '~/utils/content-extractor';
import ReactMarkdown from 'react-markdown';
import browser from 'webextension-polyfill';
import { RuntimeMessages } from '~/utils/messages';
import { Button } from './ui/button';
import CopyParagraphButton from './ui/copy-paragraph-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import { Badge } from './ui/badge';
import { cn } from '~/utils/cn';

interface HackerNewsDiscussion {
  storyId: string;
  title: string;
  discussionUrl: string;
  points: number;
  numComments: number;
  author: string;
  createdAt: string;
}

interface SummaryPanelProps {
  onWidthChange?: (width: number) => void;
}

const SummaryPanel: React.FC<SummaryPanelProps> = (props) => {
  const [isVisible, setIsVisible] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [enabledAssistants, setEnabledAssistants] = useState<Assistant[]>([]);
  const [panelWidth, setPanelWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const autoScrollRef = useRef(true);
  const shouldStopRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hnDiscussion, setHnDiscussion] = useState<HackerNewsDiscussion | null>(null);
  const [isSearchingHN, setIsSearchingHN] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [debugContext, setDebugContext] = useState<string>('');
  const [isDebugVisible, setIsDebugVisible] = useState(false);

  // Per-paragraph copy setting
  const [enablePerParagraphCopy, setEnablePerParagraphCopy] = useState<boolean>(true);
  const [sendKey, setSendKey] = useState<'enter' | 'ctrl-enter'>('ctrl-enter');
  useEffect(() => {
    const load = async () => {
      const v = await StorageService.getSetting<boolean>('perParagraphCopy', true);
      setEnablePerParagraphCopy(v ?? true);
      const sk = await StorageService.getSetting<'enter' | 'ctrl-enter'>('sendKey', 'ctrl-enter');
      setSendKey(sk ?? 'ctrl-enter');
    };
    load();
  }, []);

  useEffect(() => {
    loadModel();
    loadAssistants();
    searchHackerNews();
  }, []);

  const loadPreviousConversation = async (url: string) => {
    try {
      const history = await StorageService.getHistoryByUrl(url);
      if (history && history.messages.length > 0) {
        setMessages(history.messages);
        console.log('Loaded previous conversation for URL:', url);
      }
    } catch (error) {
      console.error('Failed to load previous conversation:', error);
    }
  };

  const searchHackerNews = async () => {
    try {
      setIsSearchingHN(true);

      // 获取当前标签页的 URL
      const response = await browser.runtime.sendMessage({
        type: RuntimeMessages.GET_TAB_INFO,
      }) as { url: string };

      if (response?.url) {
        setCurrentUrl(response.url);

        // 加载该页面的历史对话
        await loadPreviousConversation(response.url);

        // 搜索 HackerNews 讨论
        const hnResponse = await browser.runtime.sendMessage({
          type: RuntimeMessages.SEARCH_HACKERNEWS,
          payload: response.url,
        }) as { success: boolean, discussion: HackerNewsDiscussion };

        if (hnResponse?.success && hnResponse.discussion) {
          setHnDiscussion(hnResponse.discussion);
        }
      }
    } catch (error) {
      console.error('Failed to search HackerNews:', error);
    } finally {
      setIsSearchingHN(false);
    }
  };

  useEffect(() => {
    if (isResizing) {
      const handleMouseMove = (e: MouseEvent) => {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 300 && newWidth <= 800) {
          setPanelWidth(newWidth);
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  useEffect(() => {
    props.onWidthChange?.(panelWidth);
  }, [panelWidth]);

  useEffect(() => {
    if (isVisible) {
      props.onWidthChange?.(panelWidth);
    } else {
      props.onWidthChange?.(0);
    }
  }, [isVisible]);


  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  // 监听用户滚动，如果用户向上滚动则禁用自动滚动
  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = contentElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const disableThreshold = 120;
      const enableThreshold = 60;

      if (autoScrollRef.current && distanceFromBottom > disableThreshold) {
        setAutoScroll(false);
      } else if (!autoScrollRef.current && distanceFromBottom < enableThreshold) {
        setAutoScroll(true);
      }
    };

    contentElement.addEventListener('scroll', handleScroll);
    return () => contentElement.removeEventListener('scroll', handleScroll);
  }, []);

  const loadModel = async () => {
    // 加载自定义模型
    const customModels = await StorageService.getModels();

    // 加载通用模型配置
    const commonProviders = ['gemini', 'deepseek'];
    const commonModels: AIModel[] = [];

    for (const providerId of commonProviders) {
      const config = await StorageService.getCommonModelConfig(providerId);
      if (config && config.apiKey && config.model) {
        commonModels.push({
          id: `common-${providerId}`,
          name: config.name || providerId,
          provider: config.provider || 'custom',
          apiKey: config.apiKey,
          model: config.model,
          apiEndpoint: config.apiEndpoint,
        } as AIModel);
      }
    }

    // 合并所有模型
    const allModels = [...commonModels, ...customModels];

    const selectedModelId = await StorageService.getSelectedModel();
    const model = allModels.find((m) => m.id === selectedModelId) || allModels[0];
    setAvailableModels(allModels);
    if (model) {
      setSelectedModel(model);
    }
  };

  const loadAssistants = async () => {
    const assistants = await StorageService.getAssistants();
    const enabled = assistants.filter(a => a.enabled);
    setEnabledAssistants(enabled);
  };

  const stopStreaming = () => {
    shouldStopRef.current = true;
    abortControllerRef.current?.abort();
  };

  const streamResponse = async (
    sendMessages: ChatMessage[],
    visibleMessages: ChatMessage[],
    onErrorMessage: string,
    historyContext?: { pageTitle: string; pageUrl: string; assistantName?: string }
  ) => {
    if (!selectedModel) {
      alert('Please configure an AI model first');
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    shouldStopRef.current = false;
    setIsLoading(true);
    setAutoScroll(true);

    const aiService = new AIService(selectedModel);
    let assistantContent = '';

    const assistantMessage: ChatMessage = {
      id: nanoid(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    setMessages([...visibleMessages, assistantMessage]);

    try {
      for await (const token of aiService.chatStream(sendMessages, abortController.signal)) {
        if (abortController.signal.aborted || shouldStopRef.current) {
          break;
        }
        assistantContent += token;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id ? { ...msg, content: assistantContent } : msg
          )
        );
      }

      // Save conversation history after successful completion
      if (assistantContent && historyContext) {
        const finalMessages = [...visibleMessages, { ...assistantMessage, content: assistantContent }];
        const historyRecord: ConversationHistory = {
          id: nanoid(),
          pageTitle: historyContext.pageTitle,
          pageUrl: historyContext.pageUrl,
          modelName: selectedModel.name,
          modelId: selectedModel.id,
          assistantName: historyContext.assistantName,
          messages: finalMessages,
          createdAt: Date.now(),
        };
        await StorageService.saveHistory(historyRecord);
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      console.error('Streaming error:', error);
      alert(onErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    console.log('handleSummarize called, selectedModel:', selectedModel);

    try {
      console.log('Extracting page content...');
      const pageContent = await extractPageContent();
      console.log('Page content extracted:', pageContent);

      if (!pageContent) {
        alert('Failed to extract page content');
        return;
      }

      const systemMessage: ChatMessage = {
        id: nanoid(),
        role: 'system',
        content: 'You are a helpful assistant that summarizes web page content.',
        timestamp: Date.now(),
      };

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content: `Please summarize the following content:\n\n${pageContent.textContent}`,
        timestamp: Date.now(),
      };

      setDebugContext(`System: ${systemMessage.content}\n\nUser: ${userMessage.content}`);

      await streamResponse(
        [systemMessage, userMessage],
        [systemMessage, userMessage],
        'Failed to summarize content',
        { pageTitle: pageContent.title, pageUrl: currentUrl, assistantName: 'Summarize' }
      );
    } catch (error) {
      console.error('Summarize error:', error);
      alert(`Failed to summarize content: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleAssistantClick = async (assistant: Assistant) => {
    try {
      const pageContent = await extractPageContent();
      if (!pageContent) {
        alert('Failed to extract page content');
        return;
      }

      // 替换用户提示词中的 {{content}} 占位符
      const userPromptContent = assistant.userPrompt.replace(
        /\{\{content\}\}/g,
        pageContent.textContent
      );

      const systemMessage: ChatMessage = {
        id: nanoid(),
        role: 'system',
        content: assistant.systemPrompt,
        timestamp: Date.now(),
      };

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content: userPromptContent,
        timestamp: Date.now(),
      };

      setDebugContext(`System: ${systemMessage.content}\n\nUser: ${userMessage.content}`);

      // 只添加系统消息，不显示用户消息内容
      await streamResponse(
        [systemMessage, userMessage],
        [systemMessage],
        'Failed to process with assistant',
        { pageTitle: pageContent.title, pageUrl: currentUrl, assistantName: assistant.name }
      );
    } catch (error) {
      console.error('Assistant error:', error);
      alert(`Failed to process with assistant: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedModel || isLoading) return;

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    try {
      const pageContent = await extractPageContent();
      if (!pageContent) {
        throw new Error('Failed to extract page content');
      }

      // Check for existing system message to preserve persona (e.g. specific assistant prompt)
      const existingSystemMsg = messages.find(m => m.role === 'system');
      const baseSystemPrompt = existingSystemMsg
        ? existingSystemMsg.content
        : 'You are a helpful assistant with access to the current web page content. Use the provided page context to answer user questions accurately.';

      const systemMsgId = existingSystemMsg ? existingSystemMsg.id : nanoid();
      const systemMsgTimestamp = existingSystemMsg ? existingSystemMsg.timestamp : Date.now();

      // System message with context for LLM (Ephemeral, contains large context)
      const systemMessageWithContext: ChatMessage = {
        id: systemMsgId,
        role: 'system',
        content: `${baseSystemPrompt}\n\nCurrent page content:\n---\nTitle: ${pageContent.title}\n\n${pageContent.textContent}\n---`,
        timestamp: systemMsgTimestamp,
      };

      if (!existingSystemMsg) {
        setDebugContext(systemMessageWithContext.content);
      }

      // Clean system message for storage/UI (Persistent, specific prompt only)
      const storageSystemMsg: ChatMessage = {
        id: systemMsgId,
        role: 'system',
        content: baseSystemPrompt,
        timestamp: systemMsgTimestamp,
      };

      const historyMessages = messages.filter(m => m.role !== 'system');

      const messagesToSend = [systemMessageWithContext, ...historyMessages, userMessage];

      // Ensure the visible conversation (and saved history) includes the clean system message
      const visibleMessages = [storageSystemMsg, ...historyMessages, userMessage];

      // If we created a new system message (first interaction), update UI state to include it
      if (!existingSystemMsg) {
        setMessages(prev => [storageSystemMsg, ...prev]);
      }

      await streamResponse(
        messagesToSend,
        visibleMessages,
        'Failed to send message',
        { pageTitle: pageContent.title, pageUrl: currentUrl }
      );
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message');
    }
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  const handleOpenSettings = () => {
    // Send message to background script to open options page
    browser.runtime.sendMessage({ type: RuntimeMessages.OPEN_OPTIONS });
  };

  const handleAnalyzeHNDiscussion = async () => {
    if (!hnDiscussion || !selectedModel) {
      alert('Unable to analyze discussion');
      return;
    }

    try {
      setIsLoading(true);

      // 获取讨论内容
      const response = await browser.runtime.sendMessage({
        type: RuntimeMessages.FETCH_HACKERNEWS_COMMENTS,
        payload: {
          storyId: hnDiscussion.storyId,
          originalUrl: currentUrl,
        },
      }) as { success: boolean, discussionText: string };

      if (!response?.success || !response.discussionText) {
        alert('Failed to fetch discussion comments');
        return;
      }

      // 获取原文内容
      const pageContent = await extractPageContent();
      const originalText = pageContent?.textContent || '无法获取原文内容';

      // 构建分析提示词
      const analysisPrompt = `这是一个 HackerNews 的讨论串，人们在这里对一篇文章进行树状结构的讨论回复，请仔细阅读这些讨论，提炼出主要的几种观点，并引用其中你认为有价值的回复。并结合其所讨论的原文，生成一个 reading review, 包含原文的核心观点、讨论的观点、以及两者结合后的思考和分析。请使用中文输出。

讨论串:
${response.discussionText}

原文:
${originalText}`;

      const systemMessage: ChatMessage = {
        id: nanoid(),
        role: 'system',
        content: 'You are a helpful assistant that analyzes HackerNews discussions and generates insightful reading reviews in Chinese.',
        timestamp: Date.now(),
      };

      const userMessage: ChatMessage = {
        id: nanoid(),
        role: 'user',
        content: analysisPrompt,
        timestamp: Date.now(),
      };

      setDebugContext(`System: ${systemMessage.content}\n\nUser: ${userMessage.content}`);

      await streamResponse(
        [systemMessage, userMessage],
        [systemMessage],
        'Failed to analyze HackerNews discussion',
        { pageTitle: pageContent?.title || 'HackerNews Discussion', pageUrl: currentUrl, assistantName: 'HN Analyzer' }
      );
    } catch (error) {
      console.error('Failed to analyze HN discussion:', error);
      alert('Failed to analyze discussion');
    }
  };


  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className="fixed inset-y-0 right-0 z-[2147483647] flex"
      style={{ width: `${panelWidth}px` }}
    >
      <div
        className="absolute -left-1 top-0 h-full w-3 cursor-ew-resize bg-transparent transition-colors hover:bg-primary/40"
        onMouseDown={() => setIsResizing(true)}
      />

      <div
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl"
        style={{ borderLeft: '1px solid #6b7280' }}
      >
        <header className="flex items-center justify-between border-b border-border/80 px-6 py-4">
          <div className="text-lg font-semibold text-foreground">Homie</div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDebugVisible(true)}
              title="View request context"
              className={cn("text-muted-foreground/50 hover:text-foreground transition-colors", !debugContext && "opacity-0 pointer-events-none")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleOpenSettings} title="Settings">
              <span className="text-lg">⚙️</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsVisible(false)} title="Close panel">
              <span className="text-xl">×</span>
            </Button>
          </div>
        </header>

        {isDebugVisible && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200">
            <div className="relative flex h-[80%] w-[90%] flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
              <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                  <h3 className="text-sm font-medium text-foreground">Raw Context Debug</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsDebugVisible(false)}>
                  <span className="text-lg">×</span>
                </Button>
              </div>
              <div className="flex-1 overflow-auto bg-slate-50 p-4">
                <pre className="whitespace-pre-wrap text-xs text-slate-700 font-mono leading-relaxed select-text">
                  {debugContext || 'No context available yet.'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {hnDiscussion && (
          <div className="border-b border-border/70 bg-orange-50 px-6 py-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔥</span>
              <div className="flex-1">
                <div className="mb-1 text-sm font-medium text-orange-900">
                  HackerNews Discussion Found
                </div>
                <a
                  href={hnDiscussion.discussionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-700 hover:text-orange-900 hover:underline"
                >
                  {hnDiscussion.title}
                </a>
                <div className="mt-1 flex items-center gap-3 text-xs text-orange-600">
                  <span>👍 {hnDiscussion.points} points</span>
                  <span>💬 {hnDiscussion.numComments} comments</span>
                  <span>by {hnDiscussion.author}</span>
                  <span
                    className={cn(
                      "cursor-pointer hover:text-orange-900 hover:underline font-medium",
                      (isLoading || !selectedModel) && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (!isLoading && selectedModel) {
                        handleAnalyzeHNDiscussion();
                      }
                    }}
                  >
                    🤖 分析讨论内容
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isSearchingHN && !hnDiscussion && (
          <div className="border-b border-border/70 bg-gray-50 px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="animate-spin">⏳</span>
              <span>Searching HackerNews...</span>
            </div>
          </div>
        )}

        <div className="border-b border-border/70 bg-muted/40 px-6 py-4">
          {enabledAssistants.length > 0 && messages.length === 0 && (
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
          )}
        </div>

        <div ref={contentRef} className="scroll-area flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 && enabledAssistants.length === 0 && (
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
          )}

          <div className="flex flex-col gap-3">
            {messages
              .filter((msg) => msg.role !== 'system')
              .map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'rounded-2xl px-4 py-3 shadow-sm backdrop-blur transition-colors',
                    message.role === 'assistant' ? 'bg-muted/70' : 'bg-primary/10'
                  )}
                >
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          message.role === 'assistant' ? 'bg-emerald-500' : 'bg-primary'
                        )}
                      />
                      <span className="font-medium capitalize">{message.role}</span>
                    </div>
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="markdown-body text-sm leading-relaxed text-foreground/90">
                    {/* Render each paragraph separately and show a copy button on hover */}
                    {(message.content || '…').split(/\n\s*\n/).map((para, i) => {
                      const key = `${message.id}-p-${i}`;
                      return (
                        <div key={key} className="group relative mb-2">
                          {enablePerParagraphCopy && (
                            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <CopyParagraphButton text={para} />
                            </div>
                          )}
                          <ReactMarkdown components={{ p: ({ node, ...props }) => <p {...props} className="mb-0" /> }}>
                            {para}
                          </ReactMarkdown>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

          </div>

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border/80 bg-white/90 px-6 py-4 backdrop-blur">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Model</span>
              <Badge variant="outline">{selectedModel ? selectedModel.name : 'Not set'}</Badge>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearMessages}>
                Clear thread
              </Button>
            )}
          </div>

          <div className="grid gap-3">
            <Select
              value={selectedModel?.id || ''}
              onChange={(e) => {
                const model = availableModels.find((m) => m.id === e.target.value);
                if (model) {
                  setSelectedModel(model);
                  StorageService.setSelectedModel(model.id);
                }
              }}
            >
              <option value="">{availableModels.length ? 'Choose a model' : 'Configure a model first'}</option>
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.model})
                </option>
              ))}
            </Select>

            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Homie about this page..."
              onKeyDown={(e) => {
                if (sendKey === 'enter') {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                } else {
                  // Use Ctrl/Cmd + Enter to send to avoid IME commit triggering send.
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }
              }}
            />

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {sendKey === 'enter'
                  ? 'Enter to send · Shift + Enter for new line'
                  : 'Ctrl/Cmd + Enter to send · Enter for new line'}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={isLoading ? 'destructive' : 'primary'}
                  onClick={() => {
                    if (isLoading) {
                      stopStreaming();
                    } else {
                      handleSendMessage();
                    }
                  }}
                  disabled={!isLoading && (!inputValue.trim() || !selectedModel)}
                >
                  {isLoading ? 'Stop' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;
