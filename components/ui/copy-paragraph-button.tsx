import React, { useState } from 'react';
import { Button } from './button';

interface Props {
  text: string;
}

const CopyParagraphButton: React.FC<Props> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text.replace(/\u00A0/g, ' '));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Copy failed');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={copied ? 'Copied' : 'Copy paragraph'}
      title={copied ? 'Copied' : 'Copy paragraph'}
      onClick={handleCopy}
    >
      <span className="homie-text-sm">{copied ? '✅' : '📋'}</span>
    </Button>
  );
};

export default CopyParagraphButton;
