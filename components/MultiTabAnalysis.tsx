import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Loader2 } from 'lucide-react';
import { analyzeAndSummarizeTabs } from '~/utils/tabs';
import { Tabs } from 'wxt/browser';

interface SummarizedTab extends Tabs.Tab {
  summary: string;
}

interface MultiTabAnalysisProps {
  userInput: string;
  onAnalysisComplete: (summary: string) => void;
}

export const MultiTabAnalysis = ({ userInput, onAnalysisComplete }: MultiTabAnalysisProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalysis = async () => {
    setIsLoading(true);
    try {
      const { relevantTabs, combinedSummary } = await analyzeAndSummarizeTabs(userInput);

      if (relevantTabs.length > 0) {
        let messageContent = 'Based on the following tabs:\n';
        relevantTabs.forEach((tab: SummarizedTab) => {
          messageContent += `- [${tab.title}](${tab.url})\n`;
        });
        messageContent += `\nHere is a summary of their content:\n${combinedSummary}`;
        onAnalysisComplete(messageContent);
      } else {
        // Handle no relevant tabs found
        onAnalysisComplete("No relevant tabs found for your query.");
      }
    } catch (error: any) {
      console.error('Error during tab analysis:', error);
      onAnalysisComplete("An error occurred during tab analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border-t">
      <h3 className="text-lg font-semibold mb-2">Multi-Tab Analysis</h3>
      <p className="text-sm text-gray-500 mb-4">
        Analyze all open tabs to get a comprehensive summary of your current browsing session.
      </p>
      <Button onClick={handleAnalysis} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Analyze Tabs'
        )}
      </Button>
    </div>
  );
};
