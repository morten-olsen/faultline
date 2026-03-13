import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'motion/react'
import { ChatBubble, ChatBubbleTyping } from '../../components/chat-bubble/chat-bubble.tsx'
import { ChatComposer } from '../../components/chat-composer/chat-composer.tsx'
import { ChatLayout } from '../../components/chat-layout/chat-layout.tsx'
import { ChatEmptyState } from '../../components/chat-empty-state/chat-empty-state.tsx'
import { AgentStepsView } from '../../components/agent-steps-view/agent-steps-view.tsx'
import { AgentActivity } from '../../components/agent-activity/agent-activity.tsx'

import type { StepData } from '../../components/agent-steps-view/agent-steps-view.tsx'

/*
 * Agent Chat — ad-hoc conversation with the system.
 *
 * Not everything is an issue. Sometimes you just want to ask a
 * question ("is the cluster okay?"), run a quick task ("restart
 * traefik"), or understand something ("what caused the DNS problem
 * this morning?").
 *
 * The chat reuses the same components as the agent transcript:
 * TranscriptStep for tool calls and thinking, ChatBubble for
 * conversational messages. The visual language is identical —
 * you're reading the same agent, whether it's working on an
 * issue or answering your question.
 *
 * The agent is a trusted colleague. It explains concisely, acts
 * when asked, and doesn't overwhelm with data unless you ask
 * for more. A checkmark over a chart.
 */

/* ── Animation presets ────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
}

const stagger = (i: number, base = 0) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay: base + i * 0.05 },
})

/* ── Mock data ────────────────────────────────────────────────────── */

const nasHealthSteps: StepData[] = [
  {
    id: '1',
    kind: 'tool-call',
    title: 'ssh nas -- smartctl -a /dev/sda',
    duration: '1.4s',
    output: 'Model: WDC WD40EFRX-68N32N0\nSerial: WD-WCC7K0ABC123\nSMART Health: PASSED\nReallocated_Sector_Ct: 0\nCurrent_Pending_Sector: 0\nTemperature: 34°C',
  },
  {
    id: '2',
    kind: 'tool-call',
    title: 'ssh nas -- smartctl -a /dev/sdb',
    duration: '1.2s',
    output: 'Model: WDC WD40EFRX-68N32N0\nSerial: WD-WCC7K0DEF456\nSMART Health: PASSED\nReallocated_Sector_Ct: 0\nCurrent_Pending_Sector: 0\nTemperature: 35°C',
  },
  {
    id: '3',
    kind: 'tool-call',
    title: 'ssh nas -- smartctl -a /dev/sdc',
    duration: '1.1s',
    output: 'Model: WDC WD40EFRX-68N32N0\nSerial: WD-WCC7K0GHI789\nSMART Health: PASSED\nReallocated_Sector_Ct: 0\nCurrent_Pending_Sector: 0\nTemperature: 33°C',
  },
  {
    id: '4',
    kind: 'tool-call',
    title: 'ssh nas -- zpool status',
    duration: '0.8s',
    output: '  pool: tank\n state: ONLINE\n  scan: scrub repaired 0B in 03:12:45\n\tNAME        STATE     READ WRITE CKSUM\n\ttank        ONLINE       0     0     0\n\t  raidz1-0  ONLINE       0     0     0\n\t    sda     ONLINE       0     0     0\n\t    sdb     ONLINE       0     0     0\n\t    sdc     ONLINE       0     0     0',
  },
  {
    id: '5',
    kind: 'message',
    title: 'All three disks are healthy — zero reallocated sectors, temperatures normal (33–35°C). The ZFS pool is online with no errors. Last scrub completed clean.',
  },
]

const apiLatencySteps: StepData[] = [
  {
    id: '1',
    kind: 'tool-call',
    title: 'kubectl top pod -n traefik',
    duration: '0.9s',
    output: 'NAME                       CPU(cores)   MEMORY(bytes)\ntraefik-7d9bc5c94-x2k9    142m         198Mi',
  },
  {
    id: '2',
    kind: 'thinking',
    title: 'CPU is elevated at 142m, normally ~60m. Checking access logs for traffic patterns.',
    duration: '0.2s',
  },
  {
    id: '3',
    kind: 'tool-call',
    title: "kubectl logs traefik-7d9bc5c94-x2k9 -n traefik --tail=100 | grep -c '5[0-9][0-9]'",
    status: 'running',
  },
]

/* ══════════════════════════════════════════════════════════════════════
 * QUICK ANSWER — user asks a simple question, agent responds
 * ══════════════════════════════════════════════════════════════════════ */

const QuickAnswer = (): React.ReactElement => (
  <ChatLayout composer={<ChatComposer />}>
    <div className="space-y-4">
      <motion.div {...stagger(0, 0.1)}>
        <ChatBubble role="user" timestamp="just now">
          Is the cluster okay?
        </ChatBubble>
      </motion.div>
      <motion.div {...stagger(1, 0.1)}>
        <ChatBubble role="assistant" timestamp="just now">
          All clear. Three nodes healthy, all workloads running. Memory settled at 68–74% across
          the cluster after this morning's rebalance. No open issues.
        </ChatBubble>
      </motion.div>
    </div>
  </ChatLayout>
)

/* ══════════════════════════════════════════════════════════════════════
 * DEEPER QUESTION — user asks about something, agent explains
 * ══════════════════════════════════════════════════════════════════════ */

const DeeperQuestion = (): React.ReactElement => (
  <ChatLayout composer={<ChatComposer />}>
    <div className="space-y-4">
      <motion.div {...stagger(0, 0.1)}>
        <ChatBubble role="user">
          What happened with CoreDNS this morning?
        </ChatBubble>
      </motion.div>
      <motion.div {...stagger(1, 0.1)}>
        <ChatBubble role="assistant">
          A ConfigMap update at 13:58 broke the forward plugin — it removed the upstream nameserver
          block, so CoreDNS couldn't resolve external DNS. It crashed three times before I caught it.
        </ChatBubble>
      </motion.div>
      <motion.div {...stagger(2, 0.1)}>
        <ChatBubble role="assistant">
          I rolled back to the previous stable Corefile and confirmed DNS was healthy at 3ms latency.
          Took about two minutes end to end. The bad ConfigMap is still in the rollout history if
          you want to see what changed.
        </ChatBubble>
      </motion.div>
      <motion.div {...stagger(3, 0.1)}>
        <ChatBubble role="user">
          Who applied that ConfigMap change?
        </ChatBubble>
      </motion.div>
      <motion.div {...stagger(4, 0.1)}>
        <ChatBubble role="assistant">
          Checking the audit log — it was applied via kubectl by the CI pipeline at 13:58.
          Looks like it came from a Flux reconciliation, not a manual edit.
        </ChatBubble>
      </motion.div>
    </div>
  </ChatLayout>
)

/* ══════════════════════════════════════════════════════════════════════
 * AD-HOC TASK — user asks the agent to do something
 * ══════════════════════════════════════════════════════════════════════ */

const AdHocTask = (): React.ReactElement => (
  <ChatLayout composer={<ChatComposer />}>
    <div className="space-y-4">
      <motion.div {...stagger(0, 0.1)}>
        <ChatBubble role="user">
          Can you check the disk health on the NAS?
        </ChatBubble>
      </motion.div>
      <motion.div {...stagger(1, 0.1)}>
        <ChatBubble role="assistant">
          Sure, let me take a look.
        </ChatBubble>
      </motion.div>
      <motion.div {...stagger(2, 0.1)}>
        <AgentStepsView steps={nasHealthSteps} isRunning={false} />
      </motion.div>
    </div>
  </ChatLayout>
)

/* ══════════════════════════════════════════════════════════════════════
 * AGENT WORKING — mid-task, agent is actively running commands
 * ══════════════════════════════════════════════════════════════════════ */

const AgentWorking = (): React.ReactElement => (
  <ChatLayout composer={<ChatComposer disabled placeholder="Agent is working…" />}>
    <div className="space-y-4">
      <motion.div {...stagger(0, 0.1)}>
        <ChatBubble role="user">
          The API has been slow today. Can you look into it?
        </ChatBubble>
      </motion.div>
      <motion.div {...stagger(1, 0.1)}>
        <ChatBubble role="assistant">
          On it — checking traefik and the upstream services.
        </ChatBubble>
      </motion.div>
      <motion.div {...stagger(2, 0.1)}>
        <AgentStepsView steps={apiLatencySteps} isRunning={true} />
      </motion.div>
      <motion.div {...stagger(3, 0.1)} className="ml-8.5">
        <AgentActivity
          status="working"
          label="Investigating API latency"
          elapsed="12s"
        />
      </motion.div>
    </div>
  </ChatLayout>
)

/* ══════════════════════════════════════════════════════════════════════
 * FRESH — empty chat, just opened
 * ══════════════════════════════════════════════════════════════════════ */

const Fresh = (): React.ReactElement => (
  <ChatLayout composer={<ChatComposer placeholder="Ask something…" />}>
    <ChatEmptyState />
  </ChatLayout>
)

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Pages/Agent Chat',
  parameters: {
    layout: 'fullscreen',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
}

type Story = StoryObj

const EmptyState: Story = { render: Fresh }
const Quick: Story = { render: QuickAnswer }
const Explanation: Story = { render: DeeperQuestion }
const TaskWithWork: Story = { render: AdHocTask }
const Working: Story = { render: AgentWorking }

export { EmptyState, Quick, Explanation, TaskWithWork, Working }
export default meta
