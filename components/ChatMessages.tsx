import React from 'react';
import { useChatStore } from '~/stores/chatStore';
import { useSettingsStore } from '~/stores/settingsStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CopyParagraphButton from './ui/copy-paragraph-button';
import { cn } from '~/utils/cn';

interface ChatMessagesProps {
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

function getTextFromChildren(children: React.ReactNode): string {
  let text = '';
  React.Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      text += String(child);
    } else if (React.isValidElement(child) && (child.props as { children?: React.ReactNode }).children) {
      text += getTextFromChildren((child.props as { children?: React.ReactNode }).children);
    }
  });
  return text;
}

const ParagraphWithCopy: React.FC<{
  children: React.ReactNode;
  perParagraphCopy: boolean;
}> = ({ children, perParagraphCopy }) => {
  const text = getTextFromChildren(children);
  return (
    <div className="group relative mb-2">
      {perParagraphCopy && (
        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyParagraphButton text={text} />
        </div>
      )}
      <p className="mb-0">{children}</p>
    </div>
  );
};

const ChatMessages: React.FC<ChatMessagesProps> = ({ messagesEndRef }) => {
  const { messages } = useChatStore();
  const { perParagraphCopy } = useSettingsStore();

  const visibleMessages = messages.filter((msg) => msg.role !== 'system');

  if (visibleMessages.length === 0) {
    return <div ref={messagesEndRef} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {visibleMessages.map((message) => (
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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <ParagraphWithCopy perParagraphCopy={perParagraphCopy}>
                    {children}
                  </ParagraphWithCopy>
                ),
              }}
            >
              {message.content || '…'}
            </ReactMarkdown>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
