import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'motion/react'
import { AgentActivity } from '../../components/agent-activity/agent-activity.tsx'

/*
 * AgentActivity — inline indicator that an agent is working on something.
 *
 * This shows up inside timeline entries, issue cards, and wherever the
 * system is actively doing work. It tells the user: "an agent is on this,
 * here's what it's doing, and you can stop it or peek inside."
 */

/* ── Animation presets ────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
}

const stagger = (i: number, base = 0) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay: base + i * 0.05 },
})

/* ── Showcase card ────────────────────────────────────────────────── */

const ShowcaseCard = ({ children, label }: { children: React.ReactNode; label: string }): React.ReactElement => (
  <div>
    <span className="text-xs text-text-muted uppercase tracking-wider mb-3 block">{label}</span>
    <div className="max-w-md">
      {children}
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════
 * ALL STATES — every status an agent can be in
 * ══════════════════════════════════════════════════════════════════════ */

const AllStates = (): React.ReactElement => (
  <div className="bg-bg min-h-screen font-sans text-text antialiased p-8">
    <div className="max-w-xl mx-auto space-y-8">
      <motion.div {...stagger(0)}>
        <ShowcaseCard label="Working — agent actively running">
          <AgentActivity
            status="working"
            label="Analyzing memory pressure on node-02"
            elapsed="12s"
            onStop={() => {}}
            onExpand={() => {}}
          />
        </ShowcaseCard>
      </motion.div>

      <motion.div {...stagger(1)}>
        <ShowcaseCard label="Waiting — agent blocked on user">
          <AgentActivity
            status="waiting"
            label="Needs approval to evict home-assistant"
            elapsed="2m"
            onStop={() => {}}
            onExpand={() => {}}
          />
        </ShowcaseCard>
      </motion.div>

      <motion.div {...stagger(2)}>
        <ShowcaseCard label="Complete — agent finished successfully">
          <AgentActivity
            status="complete"
            label="Rebalanced workloads — memory at 61%"
            onExpand={() => {}}
          />
        </ShowcaseCard>
      </motion.div>

      <motion.div {...stagger(3)}>
        <ShowcaseCard label="Stopped — agent was stopped by user">
          <AgentActivity
            status="stopped"
            label="Investigation halted by user"
            onExpand={() => {}}
          />
        </ShowcaseCard>
      </motion.div>
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════
 * IN CONTEXT — how the indicator appears in a timeline
 * ══════════════════════════════════════════════════════════════════════ */

const InContext = (): React.ReactElement => (
  <div className="bg-bg min-h-screen font-sans text-text antialiased p-8">
    <div className="max-w-lg mx-auto">
      <motion.div {...fadeUp}>
        <span className="text-xs text-text-muted uppercase tracking-wider mb-4 block">Inside a timeline</span>
      </motion.div>

      {/* Simulated timeline entries with agent activity */}
      <div className="space-y-4">
        <motion.div {...stagger(0, 0.1)}>
          <div className="flex gap-3 pb-4 border-b border-white/4">
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-text">Rebalancing workloads to free memory</span>
                <span className="text-xs text-text-muted font-mono">14:04</span>
              </div>
              <AgentActivity
                status="working"
                label="Moving prometheus-adapter to node-01"
                elapsed="8s"
                onStop={() => {}}
                onExpand={() => {}}
              />
            </div>
          </div>
        </motion.div>

        <motion.div {...stagger(1, 0.1)}>
          <div className="flex gap-3 pb-4 border-b border-white/4">
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-text">Investigated memory allocation</span>
                <span className="text-xs text-text-muted font-mono">14:03</span>
              </div>
              <AgentActivity
                status="complete"
                label="Identified 3 low-priority pods on node-02"
                onExpand={() => {}}
              />
            </div>
          </div>
        </motion.div>

        <motion.div {...stagger(2, 0.1)}>
          <div className="flex gap-3">
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-text">Detected memory pressure</span>
                <span className="text-xs text-text-muted font-mono">14:02</span>
              </div>
              <AgentActivity
                status="complete"
                label="Assessed severity — node-02 at 84%"
                onExpand={() => {}}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Components/Agent Activity/Variants',
  parameters: {
    layout: 'fullscreen',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
}

type Story = StoryObj

const States: Story = { render: AllStates }
const Timeline: Story = { render: InContext }

export { States, Timeline }
export default meta
