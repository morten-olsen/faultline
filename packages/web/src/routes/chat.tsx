import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { AgentStep } from '@faultline/protocol';

import { useClient } from '../client/client.context.js';
import { ChatBubble } from '../components/chat-bubble/chat-bubble.tsx';
import { ChatComposer } from '../components/chat-composer/chat-composer.tsx';
import { ChatLayout } from '../components/chat-layout/chat-layout.tsx';
import { ChatEmptyState } from '../components/chat-empty-state/chat-empty-state.tsx';
import { AgentStepsView } from '../components/agent-steps-view/agent-steps-view.tsx';
import { AgentActivity } from '../components/agent-activity/agent-activity.tsx';
import type { StepData } from '../components/agent-steps-view/agent-steps-view.tsx';

/* ── Types ────────────────────────────────────────────────────────── */

type ChatEntry = { type: 'user'; id: string; content: string } | { type: 'agent'; id: string; agentLoopId: string };

/* ── Helpers ──────────────────────────────────────────────────────── */

const formatDuration = (ms: number | null): string | undefined => {
  if (ms === null) {
    return undefined;
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
};

const toStepData = (step: AgentStep): StepData => ({
  id: step.id,
  kind: step.kind === 'thinking' || step.kind === 'tool-call' || step.kind === 'message' ? step.kind : 'error',
  title: step.title,
  detail: step.detail ?? undefined,
  output: step.output ?? undefined,
  duration: formatDuration(step.durationMs),
  status: step.status === 'failed' ? 'failed' : 'complete',
});

/* ── Agent entry — fetches and renders steps for a single loop ───── */

type AgentEntryProps = {
  agentLoopId: string;
  isActive: boolean;
  onStop?: () => void;
};

const AgentEntry = ({ agentLoopId, isActive, onStop }: AgentEntryProps): React.ReactElement => {
  const client = useClient();

  const { data: stepsData } = useQuery({
    queryKey: ['agentSteps', agentLoopId],
    queryFn: () => client.call['agentSteps.list']({ agentLoopId }),
    refetchInterval: isActive ? 600 : false,
  });

  const { data: loopData } = useQuery({
    queryKey: ['agentLoop', agentLoopId],
    queryFn: () => client.call['agentLoops.get']({ id: agentLoopId }),
    refetchInterval: isActive ? 600 : false,
  });

  const steps = (stepsData?.steps ?? []).map(toStepData);
  const loop = loopData?.loop;
  const isRunning = loop?.status === 'running';
  const label = loop?.title ?? 'Working';

  return (
    <>
      <AgentStepsView steps={steps} isRunning={isRunning} />
      {isRunning && (
        <div className="mt-3 ml-8.5">
          <AgentActivity status="working" label={label} onStop={onStop} />
        </div>
      )}
    </>
  );
};

/* ── Entry list ───────────────────────────────────────────────────── */

type ChatEntryListProps = {
  entries: ChatEntry[];
  activeLoopId: string | null;
  onStop: () => void;
};

const ChatEntryList = ({ entries, activeLoopId, onStop }: ChatEntryListProps): React.ReactElement => (
  <div className="space-y-4">
    <AnimatePresence initial={false}>
      {entries.map((entry) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const }}
        >
          {entry.type === 'user' ? (
            <ChatBubble role="user">{entry.content}</ChatBubble>
          ) : (
            <AgentEntry
              agentLoopId={entry.agentLoopId}
              isActive={entry.agentLoopId === activeLoopId}
              onStop={entry.agentLoopId === activeLoopId ? onStop : undefined}
            />
          )}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

/* ── Hook: chat state ─────────────────────────────────────────────── */

const useChatState = () => {
  const client = useClient();
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [issueId, setIssueId] = useState<string | null>(null);
  const [activeLoopId, setActiveLoopId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: activeLoopData } = useQuery({
    queryKey: ['agentLoop', activeLoopId],
    queryFn: () => (activeLoopId ? client.call['agentLoops.get']({ id: activeLoopId }) : Promise.resolve(null)),
    enabled: activeLoopId !== null,
    refetchInterval: activeLoopId ? 600 : false,
  });

  useEffect(() => {
    if (!activeLoopData) {
      return;
    }
    const loop = activeLoopData.loop;
    if (loop && loop.status !== 'running') {
      setActiveLoopId(null);
    }
  }, [activeLoopData]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [entries, activeLoopId]);

  const handleSend = useCallback(
    async (content: string) => {
      let currentIssueId = issueId;

      if (!currentIssueId) {
        const { issue } = await client.call['issues.create']({
          fingerprint: `chat-${crypto.randomUUID()}`,
          source: 'ad-hoc-chat',
          title: content.length > 80 ? content.slice(0, 77) + '…' : content,
          summary: null,
          stage: 'investigation',
          priority: 'low',
        });
        currentIssueId = issue.id;
        setIssueId(currentIssueId);
      }

      const userEntry: ChatEntry = { type: 'user', id: crypto.randomUUID(), content };
      setEntries((prev) => [...prev, userEntry]);

      const { agentLoopId } = await client.call['agent.run']({ issueId: currentIssueId, prompt: content });

      const agentEntry: ChatEntry = { type: 'agent', id: crypto.randomUUID(), agentLoopId };
      setEntries((prev) => [...prev, agentEntry]);
      setActiveLoopId(agentLoopId);
    },
    [client, issueId],
  );

  const handleStop = useCallback(async () => {
    if (!activeLoopId) {
      return;
    }
    await client.call['agent.stop']({ agentLoopId: activeLoopId });
    setActiveLoopId(null);
  }, [client, activeLoopId]);

  return { entries, activeLoopId, scrollRef, handleSend, handleStop, isAgentWorking: activeLoopId !== null };
};

/* ── Chat page ────────────────────────────────────────────────────── */

const ChatPage = (): React.ReactElement => {
  const navigate = useNavigate();
  const { entries, activeLoopId, scrollRef, handleSend, handleStop, isAgentWorking } = useChatState();

  return (
    <ChatLayout
      ref={scrollRef}
      onBack={() => navigate({ to: '/' })}
      composer={
        <ChatComposer
          disabled={isAgentWorking}
          placeholder={isAgentWorking ? 'Agent is working…' : 'Ask something…'}
          onSend={handleSend}
        />
      }
    >
      {entries.length === 0 ? (
        <ChatEmptyState />
      ) : (
        <ChatEntryList entries={entries} activeLoopId={activeLoopId} onStop={handleStop} />
      )}
    </ChatLayout>
  );
};

/* ── Route ────────────────────────────────────────────────────────── */

const Route = createFileRoute('/chat')({
  component: ChatPage,
});

export { Route };
