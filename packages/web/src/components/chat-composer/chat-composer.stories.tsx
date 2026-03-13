import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatComposer } from './chat-composer.tsx'

/*
 * Chat Composer — the input for talking to the agent.
 *
 * Minimal and calm. A textarea that grows with content, a send button
 * that activates when there's something to say. Enter to send,
 * Shift+Enter for newlines. The same composer is used everywhere
 * you can talk to the agent.
 */

const meta: Meta = {
  title: 'Design System/Components/Chat Composer',
  parameters: { layout: 'padded' },
  globals: { backgrounds: { value: 'faultline' } },
}

type Story = StoryObj

const Default: Story = {
  render: () => (
    <div className="max-w-lg mx-auto space-y-8 font-sans text-text">
      <p className="text-xs text-text-muted">
        The composer sits at the bottom of the chat view. It's always
        there but never demanding — a quiet invitation to ask something.
      </p>
      <ChatComposer />
    </div>
  ),
}

const CustomPlaceholder: Story = {
  render: () => (
    <div className="max-w-lg mx-auto space-y-6 font-sans text-text">
      <p className="text-xs text-text-muted">
        The placeholder adapts to context — different prompts for different situations.
      </p>
      <div className="space-y-4">
        <ChatComposer placeholder="Ask something…" />
        <ChatComposer placeholder="Reply to the agent…" />
        <ChatComposer placeholder="Describe what you need…" />
      </div>
    </div>
  ),
}

const Disabled: Story = {
  render: () => (
    <div className="max-w-lg mx-auto space-y-6 font-sans text-text">
      <p className="text-xs text-text-muted">
        Disabled while the agent is actively working — you can stop it or wait,
        but the input is gently dimmed to avoid confusion.
      </p>
      <ChatComposer disabled placeholder="Agent is working…" />
    </div>
  ),
}

export { Default, CustomPlaceholder, Disabled }
export default meta
