
import browser from 'webextension-polyfill';
import { AIService } from '~/utils/ai-service';
import { StorageService } from '~/utils/storage';
import { RuntimeMessages } from './messages';

async function getAIService() {
    const selectedModel = await StorageService.getSelectedModel();
    const allModels = await StorageService.getModels();
    const modelConfig = allModels.find(m => m.id === selectedModel);
    if (!modelConfig) {
        throw new Error('AI model not configured');
    }
    return new AIService(modelConfig);
}

// Function to get all tabs in the current window
async function getAllTabs() {
    return await browser.runtime.sendMessage({ type: RuntimeMessages.GET_ALL_TABS });
}

// Function to inject a script into a tab and get its content
async function getTabContent(tabId: number) {
    const response: any = await browser.runtime.sendMessage({
        type: RuntimeMessages.GET_TAB_CONTENT,
        payload: { tabId },
    });
    if (response.success) {
        return response.content;
    } else {
        console.error(`Failed to get content from tab ${tabId}:`, response.error);
        return null; // Return null if content extraction fails
    }
}

import { Tabs } from 'wxt/browser';

export async function analyzeAndSummarizeTabs(userInput: string) {
    const aiService = await getAIService();
    const tabs = (await getAllTabs()) as Tabs.Tab[];

    // 1. Send tab titles and URLs to the LLM for selection
    const tabSelectionPrompt = `
        Based on the following user prompt, select the most relevant tabs from the list below.
        Return a JSON array of tab IDs, for example: [123, 456, 789].

        User Prompt: "${userInput}"

        Open Tabs:
        ${tabs.map((t) => `ID: ${t.id}, Title: ${t.title}, URL: ${t.url}`).join('\n')}
    `;

    const selectedTabsResponse = await aiService.chat(
        [{ role: 'user', content: tabSelectionPrompt, id: '', timestamp: 0 }]
    );

    let selectedTabIds: number[];
    try {
        const jsonMatch = selectedTabsResponse.match(/\[(.*?)\]/);
        if (jsonMatch && jsonMatch[0]) {
            selectedTabIds = JSON.parse(jsonMatch[0]);
        } else {
            selectedTabIds = [];
        }
    } catch {
        console.error('Failed to parse selected tabs from LLM response.');
        selectedTabIds = [];
    }


    const relevantTabs = tabs.filter((t) => t.id && selectedTabIds.includes(t.id));

    // 2. For each selected tab, get content and summarize it
    const summaries = await Promise.all(relevantTabs.map(async (tab) => {
        if (!tab.id) return null;
        const content = await getTabContent(tab.id);
        if (!content) return null;

        const summaryPrompt = `
            Please summarize the following content in a few paragraphs.

            Content:
            ${content}
        `;

        const summary = await aiService.chat(
            [{ role: 'user', content: summaryPrompt, id: '', timestamp: 0 }]
        );

        return {
            ...tab,
            summary,
        };
    }));

    const successfulSummaries = summaries.filter((s) => s !== null);

    // 3. Combine summaries
    const combinedSummary = successfulSummaries.map((s) => `Summary for "${s?.title}":\n${s?.summary}`).join('\n\n');

    return {
        relevantTabs: successfulSummaries,
        combinedSummary,
    };
}
