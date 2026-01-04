import * as React from 'react';
import { cn } from '~/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, onKeyDown, onKeyUp, onKeyPress, ...props }, ref) => {
  // Prevent keyboard events from bubbling to the page to avoid triggering page shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    onKeyDown?.(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    onKeyUp?.(e);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    onKeyPress?.(e);
  };

  return (
    <textarea
      className={cn(
        'flex min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onKeyPress={handleKeyPress}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
