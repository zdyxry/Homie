import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('should join truthy class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should filter out falsy values', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should handle empty input', () => {
    expect(cn()).toBe('');
  });

  it('should handle mixed truthy and falsy values', () => {
    expect(cn('a', undefined, 'b', null, 'c', '', 'd')).toBe('a b c d');
  });
});
