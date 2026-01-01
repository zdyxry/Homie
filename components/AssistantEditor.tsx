import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import type { Assistant } from '~/utils/storage';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { cn } from '~/utils/cn';

interface AssistantEditorProps {
  assistant: Assistant;
  onSave: (assistant: Assistant) => void;
  onCancel: () => void;
  language: 'zh' | 'en';
}

export const AssistantEditor: React.FC<AssistantEditorProps> = ({
  assistant: initialAssistant,
  onSave,
  onCancel,
  language,
}) => {
  const [assistant, setAssistant] = useState(initialAssistant);
  const [showExample, setShowExample] = useState(false);

  const t = (zh: string, en: string) => language === 'zh' ? zh : en;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  const handleSave = () => {
    if (!assistant.name.trim() || !assistant.systemPrompt.trim()) {
      alert(t('请填写名称和系统提示词', 'Please fill in name and system prompt'));
      return;
    }
    onSave(assistant);
  };

  const handleAddToCustom = () => {
    if (!assistant.systemPrompt.trim()) {
      alert(t('请填写系统提示词', 'Please fill in system prompt'));
      return;
    }
    // 创建一个新的自定义助手，基于当前内置助手
    const customAssistant: Assistant = {
      ...assistant,
      id: nanoid(),
      name: assistant.name + ' ' + t('(副本)', '(Copy)'),
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onSave(customAssistant);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-white text-card-foreground shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
              {assistant.icon}
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                {t('所有助手', 'All Assistants')}
              </p>
              <h2 className="text-xl font-semibold text-foreground">
                {assistant.icon} {assistant.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {assistant.description || t('为助手添加描述以便记忆', 'Add a short description')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {assistant.isBuiltIn && <Badge variant="secondary">Built-in</Badge>}
            <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close">
              <span className="text-xl">×</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-border px-6 py-3">
          {assistant.isBuiltIn && (
            <Button
              onClick={handleAddToCustom}
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <span>＋</span>
              <span>{t('添加到自定义助手', 'Add to custom assistants')}</span>
            </Button>
          )}
          <Button
            onClick={() => setShowExample(!showExample)}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <span>👁️</span>
            <span>{t('查看示例', 'View example')}</span>
          </Button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          {!assistant.isBuiltIn && (
            <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-background/60 p-4 shadow-sm md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('图标', 'Icon')}
                </label>
                <Input
                  value={assistant.icon}
                  onChange={(e) => setAssistant({ ...assistant, icon: e.target.value })}
                  className="text-center text-2xl"
                  placeholder="🤖"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('名称', 'Name')}
                </label>
                <Input
                  value={assistant.name}
                  onChange={(e) => setAssistant({ ...assistant, name: e.target.value })}
                  placeholder={t('助手名称', 'Assistant name')}
                />
              </div>
              <div className="md:col-span-3">
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('描述', 'Description')}
                </label>
                <Input
                  value={assistant.description}
                  onChange={(e) => setAssistant({ ...assistant, description: e.target.value })}
                  placeholder={t('简短描述助手的功能', 'Brief description of the assistant')}
                />
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">
                {t('系统提示词', 'System Prompt')}
              </label>
              <Textarea
                value={assistant.systemPrompt}
                onChange={(e) =>
                  setAssistant({ ...assistant, systemPrompt: e.target.value })
                }
                className={cn(
                  'font-mono text-sm leading-relaxed',
                  assistant.isBuiltIn ? 'min-h-[320px]' : 'min-h-[280px]'
                )}
                placeholder={t('输入系统提示词...', 'Enter system prompt...')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">
                {t('用户提示词', 'User Prompt')}
              </label>
              <Textarea
                value={assistant.userPrompt}
                onChange={(e) =>
                  setAssistant({ ...assistant, userPrompt: e.target.value })
                }
                className={cn(
                  'font-mono text-sm leading-relaxed bg-muted/50',
                  assistant.isBuiltIn ? 'min-h-[320px]' : 'min-h-[280px]'
                )}
                placeholder={t('输入用户提示词...', 'Enter user prompt...')}
              />
              <p className="text-xs text-muted-foreground">
                {t('使用 {{content}} 作为内容占位符', 'Use {{content}} as content placeholder')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={onCancel}>
            {t('取消', 'Cancel')}
          </Button>
          <Button onClick={handleSave}>
            {t('保存', 'Save')}
          </Button>
        </div>

        {showExample && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 p-6">
            <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-2xl border border-border bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold text-foreground">{t('示例输出', 'Example Output')}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowExample(false)} aria-label="Close example">
                  <span className="text-xl">×</span>
                </Button>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap font-mono overflow-auto max-h-[60vh]">
                {t(`## 核心分析
这篇文章深入探讨了分布式系统中时钟同步这一基础但至关重要的问题。文章首先揭示了“不存在全局时钟”这一核心挑战，解释了由于石英晶体振荡器受温度和制造差异影响，即使初始同步的计算机时钟也会不可避免地发生漂移。这种时钟偏差和漂移在分布式系统中会导致严重后果，例如构建系统错误地跳过重新编译、数据库事务排序错误导致一致性违规，以及分布式追踪失效。为了解决这些问题，文章系统性地介绍了从物理时钟同步到逻辑时钟的一系列解决方案。物理时钟同步方法包括Cristian算法、Berkeley算法、网络时间协议（NTP）和精度时间协议（PTP），其精度从毫秒级提升到纳秒级，但成本和部署复杂度也随之增加。对于不需要绝对物理时间的场景，逻辑时钟（如Lamport时间戳和向量时钟）通过追踪事件间的因果关系来提供顺序保证，避免了物理时钟同步的难题。文章还以Google Spanner的TrueTime和CockroachDB的混合逻辑时钟（HLC）为例，展示了工业界如何根据自身资源和需求（从部署原子钟到使用商用硬件）来设计折衷方案。最终，文章强调时钟同步的本质是在精度、延迟和复杂性之间进行权衡，不存在普适的解决方案，开发者需要根据具体应用的需求、预算和对复杂性的容忍度来做出明智选择。

关键要点：

不存在全局时钟，物理时钟因石英晶体缺陷必然会产生漂移，导致分布式系统各节点时间不一致。
时钟偏差会引发严重问题，如构建失败、数据库事务排序错误和调试困难。
物理时钟同步方案（NTP, PTP）追求绝对时间精度，但受网络延迟、不对称性和硬件成本限制。
逻辑时钟（Lamport， 向量时钟）放弃绝对时间，通过追踪因果关系来排序事件，但无法提供物理时间点。
工业级解决方案（如TrueTime, HLC）是结合物理与逻辑时钟的混合方案，在一致性、精度和成本间取得平衡。

创新见解：

时钟同步问题的核心不是追求完美，而是管理“不确定性”并设定可接受的误差边界。
在分布式系统中，“事件发生的顺序”往往比“事件发生的精确物理时间”更重要。
混合逻辑时钟（HLC）巧妙地将物理时钟的易读性与逻辑时钟的因果保障结合，是资源受限场景下的优雅实践。
Google TrueTime 的“提交等待”机制，通过主动引入可控延迟来换取强一致性，体现了工程上深刻的权衡艺术。
应对时钟异常（如回跳、闰秒）需要系统性的防御性编程，而不仅仅是依赖同步协议。

重要引用与翻译
原文1：The answer lies in this one simple statement - there is no global clock. When you have thousands of machines spread across data centers, continents, and time zones, each operating independently, the simple question of “what time is it?” becomes surprisingly complex.（第2段）

翻译： 答案在于一个简单的陈述——不存在全局时钟。当你有成千上万的机器分布在数据中心、大洲和时区，每台机器独立运行时，“现在几点？”这个简单问题就变得异常复杂。 引用理由： 这句话是全文的基石，它直击分布式系统时钟同步问题的根源，颠覆了我们对“时间”单一、绝对的直觉认知，为后文所有复杂性的讨论奠定了基础。

原文2：The key innovation is that TrueTime does not return a single timestamp. It returns an interval guaranteed to contain the true time.（第X段，TrueTime部分）

翻译： 关键创新在于，TrueTime 不返回单一的时间戳。它返回一个保证包含真实时间的区间。 引用理由： 这体现了Google解决时钟同步问题的核心哲学：承认并量化不确定性，而非试图消除它。这种基于“时间区间”的抽象是实现Spanner外部一致性的理论基础，是工程思维的高度体现。

原文3：Clock synchronization in distributed systems always involves a tradeoff between accuracy, latency, and complexity.（第X段，结尾部分）

翻译： 分布式系统中的时钟同步始终涉及精度、延迟和复杂性之间的权衡。 引用理由： 这句话是对全文的完美总结，点明了时钟同步没有银弹的本质。它提醒架构师和开发者，技术选型必须基于对自身业务需求、资源约束和风险承受能力的清醒认知。

行动与改变
行动建议： 在设计和评审分布式系统时，明确记录并评审系统对时钟同步的准确度要求（例如，是毫秒、微秒还是仅需因果顺序），并据此选择合适的技术栈（NTP、PTP或逻辑时钟）。同时，在代码中引入“安全时钟”抽象层，以防御性地处理时钟回跳等异常情况。

认知升级： 时间在分布式系统中并非一个客观、统一的度量，而是一个需要精心管理和协商的、具有不确定性的分布式状态。理解这一点，意味着从追求“绝对正确的时间”转变为管理“有界误差的时间”或“事件间的可靠顺序”，这是构建可靠分布式系统的关键思维转变。

关键术语解释
时钟偏差（Clock Skew）：在某一时刻，两个时钟读数之间的瞬时差值。
时钟漂移（Clock Drift）：时钟随时间推移而发散的速度或速率，通常由石英晶体的物理缺陷引起。
逻辑时钟（Logical Clock）：一种不依赖于物理时间的机制，通过追踪事件间的因果关系（如消息发送/接收）来为事件分配顺序编号（如Lamport时间戳）。
向量时钟（Vector Clock）：逻辑时钟的一种扩展，为系统中的每个进程维护一个向量计数器，可以精确判断任意两个事件是因果相关还是并发。
外部一致性（External Consistency）：一种强一致性模型，保证事务提交的顺序与真实物理时间的顺序一致。即，如果事务T1在物理时间上早于T2提交，那么所有观察者都会看到T1在T2之前生效。

发散联想
读完作者的观点，我联想到物理学中的“相对论”。在分布式系统中，“同时性”同样是一个相对的概念。正如爱因斯坦揭示没有绝对的时空，分布式系统也否定了“全局现在”的存在。每个节点都活在自己的“本地时空”里，通过消息传递（类似物理中的光信号）来尝试建立对事件顺序的共识。TrueTime的“时间区间”很像量子力学中的“不确定性原理”——我们无法同时精确知道一个事件发生的精确时间和顺序，只能确定它在一个范围内。这启示我们，在复杂系统设计中，接受根本性的不确定性并围绕其进行设计，比徒劳地追求确定性更具智慧和实用性。就像人类通过协议和约定（如时区、日历）来协作一样，分布式系统也需要精妙的“时间协议”来维持秩序。`, `## Core Analysis
This article thoroughly examines clock synchronization in distributed systems, a fundamental yet crucial problem. It opens by stating the core challenge: there is no global clock—quartz oscillators vary with temperature and manufacturing differences, so even initially synchronized clocks drift over time. Such skew and drift cause serious issues in distributed systems, such as build systems incorrectly skipping rebuilds, database transaction ordering mistakes causing consistency violations, and broken distributed tracing. To address these problems, the article systematically presents solutions ranging from physical clock synchronization to logical clocks. Physical synchronization techniques include Cristian, Berkeley, Network Time Protocol (NTP), and Precision Time Protocol (PTP), with accuracy from milliseconds to nanoseconds, at increasing cost and deployment complexity. For scenarios that don't require absolute physical time, logical clocks (Lamport timestamps, vector clocks) provide ordering by capturing causal relationships without the difficulties of physical synchronization. The article also uses Google Spanner's TrueTime and CockroachDB's Hybrid Logical Clock (HLC) as examples of how industry designs tradeoffs—ranging from deploying atomic clocks to using commercial hardware—based on resources and needs. Ultimately, the piece stresses that clock synchronization is about tradeoffs among accuracy, latency, and complexity; there is no one-size-fits-all solution, and developers must choose wisely according to application requirements, budget, and tolerance for complexity.

Key Points:

- There is no global clock; physical clocks drift due to quartz imperfections, causing time inconsistencies across nodes.
- Clock skew leads to serious problems like build failures, incorrect transaction ordering, and debugging difficulty.
- Physical synchronization (NTP, PTP) aims for absolute time but is limited by network latency, asymmetry, and hardware costs.
- Logical clocks (Lamport, Vector Clocks) abandon absolute time and order events by causality, but cannot provide physical timestamps.
- Industrial solutions (TrueTime, HLC) combine physical and logical approaches to balance consistency, accuracy, and cost.

Insights:

- The core of clock synchronization is not perfect accuracy but managing "uncertainty" and setting acceptable error bounds.
- In distributed systems, the order of events often matters more than exact physical timestamps.
- HLC elegantly combines the readability of physical clocks with the causal guarantees of logical clocks—an elegant approach for resource-constrained settings.
- Google's TrueTime commit-wait mechanism trades controlled delay for strong consistency, exemplifying engineering tradeoffs.
- Defending against clock anomalies (jumps, leap seconds) requires systematic defensive programming rather than relying solely on sync protocols.

Notable Quotes & Translations
Original 1: "The answer lies in this one simple statement - there is no global clock. When you have thousands of machines spread across data centers, continents, and time zones, each operating independently, the simple question of 'what time is it?' becomes surprisingly complex." (para 2)

Translation: The answer lies in one simple statement—there is no global clock. When thousands of machines are spread across data centers, continents, and time zones, each operating independently, the simple question "what time is it?" becomes surprisingly complex. Reason: This sentence is foundational; it pinpoints the root of clock sync issues and overturns the intuitive notion of a single, absolute time.

Original 2: "The key innovation is that TrueTime does not return a single timestamp. It returns an interval guaranteed to contain the true time." (TrueTime section)

Translation: The core innovation is that TrueTime does not return a single timestamp; it returns an interval guaranteed to contain the true time. Reason: This demonstrates Google's philosophy of acknowledging and quantifying uncertainty rather than trying to eliminate it. The time-interval abstraction underpins Spanner's external consistency and is a profound engineering insight.

Original 3: "Clock synchronization in distributed systems always involves a tradeoff between accuracy, latency, and complexity." (conclusion)

Translation: Clock synchronization in distributed systems always involves a tradeoff between accuracy, latency, and complexity. Reason: This sentence perfectly summarizes the article and reminds architects that choices must be based on requirements, constraints, and risk tolerance.

Actions & Changes
Actionable suggestion: During the design and review of distributed systems, explicitly document and review required clock accuracy (e.g., milliseconds, microseconds, or just causal ordering), and choose the appropriate stack (NTP, PTP, or logical clocks). Also introduce a "safe clock" abstraction in code to defensively handle anomalies like clock jumps.

Cognitive upgrade: Time in distributed systems is not an objective, unified measure but a distributed state with uncertainty that must be managed and negotiated. Understanding this shifts the mindset from seeking "absolute correct time" to managing "bounded-error time" or "reliable event ordering," a crucial shift for building robust distributed systems.

Key Terms
Clock Skew: The instantaneous difference between two clock readings at a given moment.
Clock Drift: The rate at which a clock diverges over time, typically due to physical defects in quartz crystals.
Logical Clock: A mechanism independent of physical time that assigns ordering numbers to events by tracking causality (e.g., Lamport timestamps).
Vector Clock: An extension of logical clocks that maintains a vector counter per process, enabling precise determination of causal relationships between events.
External Consistency: A strong consistency model that ensures transaction commit order aligns with real physical time. If transaction T1 commits before T2 in physical time, all observers see T1 take effect before T2.

Further Associations
Reading the author's perspective evokes analogies to relativity in physics. In distributed systems, simultaneity is likewise relative. Just as Einstein revealed the absence of absolute spacetime, distributed systems deny a "global now." Each node exists in its own "local spacetime," using message passing (akin to light signals in physics) to try and build consensus on event ordering. TrueTime's time-interval idea resembles quantum uncertainty—the impossibility of simultaneously knowing exact time and order—suggesting that accepting fundamental uncertainty and designing around it is more practical than pursuing elusive determinism. As humans coordinate using protocols and conventions (time zones, calendars), distributed systems also rely on finely tuned "time protocols" to maintain order.`)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
