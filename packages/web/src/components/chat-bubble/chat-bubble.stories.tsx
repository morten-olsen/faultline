import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBubble, ChatBubbleTyping } from './chat-bubble.tsx'

/*
 * Chat Bubble — conversational messages between the user and the agent.
 *
 * These are the same bubbles used in both the ad-hoc chat and
 * inline within agent transcripts when the system explains something
 * conversationally. The agent doesn't use a bubble background — it
 * speaks directly, like a colleague talking. The user's messages
 * get a subtle surface to distinguish who said what.
 */

const meta: Meta = {
  title: 'Design System/Components/Chat Bubble',
  parameters: { layout: 'padded' },
  globals: { backgrounds: { value: 'faultline' } },
}

type Story = StoryObj

const UserMessage: Story = {
  render: () => (
    <div className="max-w-lg mx-auto space-y-4 font-sans text-text">
      <p className="text-xs text-text-muted mb-6">
        User messages sit on the right with a subtle background — they're clearly
        yours but don't dominate the conversation.
      </p>
      <ChatBubble role="user" timestamp="just now">
        Is node-02 still having memory issues?
      </ChatBubble>
      <ChatBubble role="user">
        Can you restart the traefik pod?
      </ChatBubble>
      <ChatBubble role="user" timestamp="2m ago">
        What's the current state of the cluster? I saw some alerts earlier
        but haven't had a chance to check in.
      </ChatBubble>
    </div>
  ),
}

const AssistantMessage: Story = {
  render: () => (
    <div className="max-w-lg mx-auto space-y-4 font-sans text-text">
      <p className="text-xs text-text-muted mb-6">
        The agent speaks without a bubble — calm, direct, like reading
        a colleague's note. Not a chat bot, a trusted team member.
      </p>
      <ChatBubble role="assistant" timestamp="just now">
        Node-02 is at 71% memory now. The rebalance earlier moved three workloads to node-01
        and it's been stable since.
      </ChatBubble>
      <ChatBubble role="assistant">
        Everything looks good. Five issues handled today, all automatic. The CoreDNS restart
        this morning was the most interesting one — bad ConfigMap update broke the forward plugin.
        Rolled it back in about two minutes.
      </ChatBubble>
    </div>
  ),
}

const Conversation: Story = {
  render: () => (
    <div className="max-w-lg mx-auto space-y-4 font-sans text-text">
      <p className="text-xs text-text-muted mb-6">
        A natural back-and-forth. The agent explains concisely, offers
        to help, and doesn't overwhelm with data unless asked.
      </p>
      <ChatBubble role="user">
        What's going on with the cluster right now?
      </ChatBubble>
      <ChatBubble role="assistant">
        All clear. Memory settled after this morning's rebalance — node-02 is at 71%, node-03
        at 74%. API latency is back to normal at 82ms.
      </ChatBubble>
      <ChatBubble role="user">
        Nice. Can you check if the nightly backup ran?
      </ChatBubble>
      <ChatBubble role="assistant">
        Yes, it ran at 03:00. All 8 persistent volumes snapshotted successfully, 12.4 GB total.
        No errors.
      </ChatBubble>
    </div>
  ),
}

const Typing: Story = {
  render: () => (
    <div className="max-w-lg mx-auto space-y-4 font-sans text-text">
      <p className="text-xs text-text-muted mb-6">
        When the agent is composing a response, a gentle typing indicator
        appears. Calm and unhurried — the system is thinking, not loading.
      </p>
      <ChatBubble role="user">
        What caused the CoreDNS crash this morning?
      </ChatBubble>
      <ChatBubbleTyping />
      <div className="mt-6 border-t border-white/5 pt-6">
        <ChatBubble role="user">
          Run a health check on the NAS
        </ChatBubble>
        <div className="mt-4">
          <ChatBubbleTyping label="Checking NAS health…" />
        </div>
      </div>
    </div>
  ),
}

export { UserMessage, AssistantMessage, Conversation, Typing }
export default meta
