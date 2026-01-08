import React, { useState, useEffect, useMemo } from 'react';
import { StorageService, type ConversationHistory } from '~/utils/storage';
import { Button } from './ui/button';
import CopyParagraphButton from './ui/copy-paragraph-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Badge } from './ui/badge';
import ReactMarkdown from 'react-markdown';

interface HistoryTabProps {
    language: 'zh' | 'en';
}

const ITEMS_PER_PAGE = 10;

export const HistoryTab: React.FC<HistoryTabProps> = ({ language }) => {
    const [history, setHistory] = useState<ConversationHistory[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [modelFilter, setModelFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState<ConversationHistory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [enablePerParagraphCopy, setEnablePerParagraphCopy] = useState<boolean>(true);

    useEffect(() => {
        const load = async () => {
            const v = await StorageService.getSetting<boolean>('perParagraphCopy', true);
            setEnablePerParagraphCopy(v ?? true);
        };
        load();
    }, []);

    const t = (zh: string, en: string) => (language === 'zh' ? zh : en);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setIsLoading(true);
        const data = await StorageService.getHistory();
        setHistory(data);
        setIsLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(t('确定要删除此记录吗？', 'Are you sure you want to delete this record?'))) {
            await StorageService.deleteHistory(id);
            await loadHistory();
        }
    };

    const handleClearAll = async () => {
        if (confirm(t('确定要清空所有历史记录吗？此操作不可恢复。', 'Are you sure you want to clear all history? This action cannot be undone.'))) {
            await StorageService.clearAllHistory();
            await loadHistory();
        }
    };

    // Get unique model names for filter
    const modelOptions = useMemo(() => {
        const models = new Set(history.map((h) => h.modelName));
        return Array.from(models);
    }, [history]);

    // Filter and search
    const filteredHistory = useMemo(() => {
        return history.filter((item) => {
            const matchesSearch =
                searchQuery === '' ||
                item.pageTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.pageUrl.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesModel = modelFilter === 'all' || item.modelName === modelFilter;
            return matchesSearch && matchesModel;
        });
    }, [history, searchQuery, modelFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, modelFilter]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const truncateUrl = (url: string, maxLength = 50) => {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength) + '...';
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex min-h-[200px] items-center justify-center">
                    <div className="text-muted-foreground">{t('加载中...', 'Loading...')}</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('历史记录', 'History')}</CardTitle>
                        <CardDescription>
                            {t(
                                `共 ${history.length} 条会话记录`,
                                `${history.length} conversation record${history.length !== 1 ? 's' : ''}`
                            )}
                        </CardDescription>
                    </div>
                    {history.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleClearAll}>
                            {t('清空全部', 'Clear All')}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <Input
                            type="search"
                            placeholder={t('搜索标题或 URL...', 'Search title or URL...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64"
                        />
                        <Select
                            value={modelFilter}
                            onChange={(e) => setModelFilter(e.target.value)}
                            className="w-44"
                        >
                            <option value="all">{t('全部模型', 'All Models')}</option>
                            {modelOptions.map((model) => (
                                <option key={model} value={model}>
                                    {model}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* Table */}
                    {filteredHistory.length === 0 ? (
                        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
                            <div className="text-4xl">📜</div>
                            <p className="mt-2 text-sm">
                                {history.length === 0
                                    ? t('暂无历史记录', 'No history yet')
                                    : t('没有匹配的记录', 'No matching records')}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-border">
                            <table className="w-full text-sm">
                                <thead className="border-b border-border bg-muted/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-foreground">
                                            {t('页面', 'Page')}
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-foreground">
                                            {t('模型', 'Model')}
                                        </th>
                                        <th className="px-4 py-3 text-left font-medium text-foreground">
                                            {t('时间', 'Time')}
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium text-foreground">
                                            {t('操作', 'Actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {paginatedHistory.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="h-16 cursor-pointer transition-colors hover:bg-muted/40"
                                            onClick={() => setSelectedItem(item)}
                                        >
                                            <td className="max-w-xs px-4 py-3">
                                                <div className="truncate font-medium text-foreground">{item.pageTitle || t('无标题', 'Untitled')}</div>
                                                <div className="truncate text-xs text-muted-foreground" title={item.pageUrl}>
                                                    {truncateUrl(item.pageUrl)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{item.modelName}</Badge>
                                                    {item.assistantName && (
                                                        <Badge variant="secondary">{item.assistantName}</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {formatDate(item.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button variant="ghost" size="sm" onClick={(e) => handleDelete(item.id, e)}>
                                                    {t('删除', 'Delete')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                {t(
                                    `第 ${currentPage} 页，共 ${totalPages} 页`,
                                    `Page ${currentPage} of ${totalPages}`
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((p) => p - 1)}
                                >
                                    {t('上一页', 'Previous')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((p) => p + 1)}
                                >
                                    {t('下一页', 'Next')}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Modal */}
            {selectedItem && (
                <HistoryDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    language={language}
                    enablePerParagraphCopy={enablePerParagraphCopy}
                />
            )}
        </div>
    );
};

interface HistoryDetailModalProps {
    item: ConversationHistory;
    onClose: () => void;
    language: 'zh' | 'en';
    enablePerParagraphCopy: boolean;
}

const HistoryDetailModal: React.FC<HistoryDetailModalProps> = ({ item, onClose, language, enablePerParagraphCopy }) => {
    const t = (zh: string, en: string) => (language === 'zh' ? zh : en);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border px-6 py-4">
                    <div className="flex-1 pr-4">
                        <h2 className="text-lg font-semibold text-foreground">
                            {item.pageTitle || t('无标题', 'Untitled')}
                        </h2>
                        <a
                            href={item.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                        >
                            {item.pageUrl}
                        </a>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{t('模型', 'Model')}: {item.modelName}</span>
                            {item.assistantName && <span>{t('助手', 'Assistant')}: {item.assistantName}</span>}
                            <span>{formatDate(item.createdAt)}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <span className="text-xl">×</span>
                    </Button>
                </div>

                {/* Messages */}
                <div className="max-h-[calc(85vh-100px)] overflow-y-auto px-6 py-4">
                    <div className="space-y-4">
                        {item.messages
                            .filter((msg) => msg.role !== 'system')
                            .map((message) => (
                                <div
                                    key={message.id}
                                    className={`rounded-xl border px-4 py-3 ${message.role === 'assistant'
                                        ? 'border-border bg-muted/50'
                                        : 'border-primary/30 bg-primary/5'
                                        }`}
                                >
                                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`h-2 w-2 rounded-full ${message.role === 'assistant' ? 'bg-emerald-500' : 'bg-primary'
                                                    }`}
                                            />
                                            <span className="font-medium capitalize">{message.role}</span>
                                        </div>
                                        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="markdown-body prose prose-sm max-w-none text-foreground/90">
                                        {(message.content || '…').split(/\n\s*\n/).map((para, i) => (
                                            <div key={`${message.id}-p-${i}`} className="group relative mb-2">
                                                {enablePerParagraphCopy && (
                                                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <CopyParagraphButton text={para} />
                                                    </div>
                                                )}
                                                <ReactMarkdown components={{ p: ({ node, ...props }) => <p {...props} className="mb-0" /> }}>
                                                    {para}
                                                </ReactMarkdown>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryTab;
