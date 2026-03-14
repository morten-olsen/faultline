import { ChatBubble, ChatBubbleTyping } from '../chat-bubble/chat-bubble.tsx';
import { TranscriptStep } from '../transcript-step/transcript-step.tsx';
import { WorkBlock } from '../work-block/work-block.tsx';
import type { TranscriptStepKind, TranscriptStepStatus } from '../transcript-step/transcript-step.tsx';

type StepData = {
  id: string;
  kind: TranscriptStepKind;
  title: string;
  detail?: string;
  output?: string;
  duration?: string;
  status?: TranscriptStepStatus;
};

type AgentStepsViewProps = {
  steps: StepData[];
  isRunning: boolean;
};

const AgentStepsView = ({ steps, isRunning }: AgentStepsViewProps): React.ReactElement => {
  // Find the final message step (the agent's conversational response)
  const messageSteps = steps.filter((s) => s.kind === 'message');
  const lastMessage = messageSteps[messageSteps.length - 1];

  // Work steps are everything that isn't the final message
  const workSteps = lastMessage ? steps.filter((s) => s.id !== lastMessage.id) : steps;

  return (
    <div className="space-y-3">
      {/* Work block — tool calls and thinking */}
      {workSteps.length > 0 && (
        <WorkBlock>
          {workSteps.map((step, i) => (
            <TranscriptStep
              key={step.id}
              kind={step.kind}
              status={
                isRunning && i === workSteps.length - 1 && !lastMessage
                  ? 'running'
                  : step.status === 'failed'
                    ? 'failed'
                    : (step.status ?? 'complete')
              }
              title={step.title}
              detail={step.detail}
              output={step.output}
              duration={step.duration}
              collapsible={step.kind === 'tool-call' || step.kind === 'thinking'}
              defaultOpen={i === workSteps.length - 1 && step.kind === 'tool-call'}
              isLast={i === workSteps.length - 1}
            />
          ))}
        </WorkBlock>
      )}

      {/* Conversational response */}
      {lastMessage && <ChatBubble role="assistant">{lastMessage.detail ?? lastMessage.title}</ChatBubble>}

      {/* Typing indicator when agent is working but no steps yet */}
      {isRunning && !lastMessage && steps.length === 0 && <ChatBubbleTyping />}

      {/* Working indicator when agent is running tools */}
      {isRunning && steps.length > 0 && !lastMessage && (
        <div className="ml-8.5 flex items-center gap-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs text-text-muted">Working…</span>
        </div>
      )}
    </div>
  );
};

export type { AgentStepsViewProps, StepData };
export { AgentStepsView };
