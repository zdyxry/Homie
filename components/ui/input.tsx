import * as React from 'react';
import { cn } from '~/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', onKeyDown, onKeyUp, onKeyPress, ...props }, ref) => {
  // Prevent keyboard events from bubbling to the page to avoid triggering page shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onKeyDown?.(e);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onKeyUp?.(e);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onKeyPress?.(e);
  };

  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
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

Input.displayName = 'Input';
