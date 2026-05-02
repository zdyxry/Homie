import React from 'react';
import { Button } from './ui/button';
import { cn } from '~/utils/cn';
import browser from 'webextension-polyfill';
import { RuntimeMessages } from '~/utils/messages';
import { useDebugStore } from '~/stores/debugStore';

interface PanelHeaderProps {
  onClose: () => void;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({ onClose }) => {
  const { debugContext, isVisible, show, hide } = useDebugStore();

  const handleOpenSettings = () => {
    browser.runtime.sendMessage({ type: RuntimeMessages.OPEN_OPTIONS });
  };

  return (
    <header className="flex items-center justify-between border-b border-border/80 px-6 py-4">
      <div className="text-lg font-semibold text-foreground">Homie</div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={show}
          title="View request context"
          className={cn(
            'text-muted-foreground/50 hover:text-foreground transition-colors',
            !debugContext && 'opacity-0 pointer-events-none'
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleOpenSettings} title="Settings">
          <span className="text-lg">⚙️</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onClose} title="Close panel">
          <span className="text-xl">×</span>
        </Button>
      </div>

      {isVisible && (
        <DebugModal context={debugContext} onClose={hide} />
      )}
    </header>
  );
};

const DebugModal: React.FC<{ context: string; onClose: () => void }> = ({ context, onClose }) => {
  return (
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
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <span className="text-lg">×</span>
          </Button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          <pre className="whitespace-pre-wrap text-xs text-slate-700 font-mono leading-relaxed select-text">
            {context || 'No context available yet.'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PanelHeader;
