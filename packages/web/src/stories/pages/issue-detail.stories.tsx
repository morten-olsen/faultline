import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  CircleCheck, Eye, Wrench, ArrowRight, Hand,
} from 'lucide-react'
import { motion } from 'motion/react'
import { TopBar } from '../../components/top-bar/top-bar.tsx'
import { StagePill } from '../../components/stage-pill/stage-pill.tsx'
import { Badge } from '../../components/badge/badge.tsx'
import { Button } from '../../components/button/button.tsx'
import { TimelineEntry } from '../../components/timeline-entry/timeline-entry.tsx'
import { ResourceChip } from '../../components/resource-chip/resource-chip.tsx'
import { AgentActivity } from '../../components/agent-activity/agent-activity.tsx'

/*
 * Issue Detail — the full story behind one issue.
 *
 * One click deeper from the home feed. This is where the
 * curious user goes to understand what happened, why, and
 * what the system is doing about it.
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

/* ── Section label ─────────────────────────────────────────────────── */

type SectionLabelProps = {
  children: React.ReactNode
  delay?: number
}

const SectionLabel = ({ children, delay = 0 }: SectionLabelProps): React.ReactElement => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, delay }}
    className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3 mt-10"
  >
    {children}
  </motion.div>
)

/* ── Page shell ────────────────────────────────────────────────────── */

const Shell = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div className="bg-bg min-h-screen font-sans text-text antialiased">
    <div className="max-w-lg mx-auto px-5">
      <TopBar variant="detail" />
      <div className="pt-4 pb-12">
        {children}
      </div>
    </div>
  </div>
)

/* ── Related issue row ─────────────────────────────────────────────── */

type RelatedRowProps = {
  title: string
  relation: string
  stage: string
  time: string
  icon: typeof Wrench
  iconColor: string
  delay?: number
}

const RelatedRow = ({ title, relation, stage, time, icon: Icon, iconColor, delay = 0 }: RelatedRowProps): React.ReactElement => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const, delay }}
    className="group flex items-start gap-3 py-3 -mx-2 px-2 rounded-lg cursor-pointer hover:bg-white/3 transition-colors"
  >
    <div className="mt-0.5 flex-shrink-0">
      <Icon size={15} className={iconColor} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-text group-hover:text-white transition-colors truncate">{title}</span>
        <span className="text-xs text-text-muted font-mono flex-shrink-0">{time}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-xs text-text-muted">{relation}</span>
        <span className="text-xs text-text-muted/40">·</span>
        <span className="text-xs text-text-muted">{stage}</span>
      </div>
    </div>
  </motion.div>
)

/* ── Animated timeline entry wrapper ──────────────────────────────── */

type AnimatedTimelineProps = {
  index: number
  baseDelay?: number
  children: React.ReactNode
}

const AnimatedTimeline = ({ index, baseDelay = 0, children }: AnimatedTimelineProps): React.ReactElement => (
  <motion.div {...stagger(index, baseDelay)}>
    {children}
  </motion.div>
)

/* ══════════════════════════════════════════════════════════════════════
 * IN PROGRESS — system actively working, needs-you for approval
 * ══════════════════════════════════════════════════════════════════════ */

const InProgressNeedsYou = (): React.ReactElement => (
  <Shell>
    {/* Header */}
    <motion.div {...fadeUp} className="mb-6">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h1 className="text-xl font-medium tracking-tight">Memory pressure on node-02 and node-03</h1>
        <span className="text-xs text-text-muted font-mono flex-shrink-0">14m</span>
      </div>
      <div className="flex items-center gap-2">
        <StagePill stage="proposed-plan" needsYou />
        <Badge variant="warning">Regressed</Badge>
      </div>
    </motion.div>

    {/* Needs-you card */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.12 }}
      className="bg-white/3 ring-1 ring-amber-500/12 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Hand size={15} className="text-amber-400/80" />
        <span className="text-sm font-medium text-text">Approve evicting home-assistant?</span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">
        Memory has been above 80% for over an hour despite two rebalancing attempts. The most
        effective option is to evict home-assistant temporarily — your smart home would be
        offline for about 3 minutes, then resume automatically.
      </p>
      <div className="flex items-center gap-2 pt-1">
        <Button variant="primary" size="sm">Approve</Button>
        <Button variant="ghost" size="sm">Remind me later</Button>
      </div>
    </motion.div>

    {/* Summary */}
    <motion.p
      {...stagger(0, 0.25)}
      className="text-sm text-text-secondary leading-relaxed mt-6"
    >
      Both nodes have been running above 80% memory for over an hour. The initial rebalance
      moved low-priority workloads to node-01, but memory climbed back within 8 minutes. This
      is the second attempt — the system has exhausted safe automated options and needs approval
      for a more disruptive fix.
    </motion.p>

    {/* Timeline */}
    <SectionLabel delay={0.35}>What happened</SectionLabel>
    <div>
      <AnimatedTimeline index={0} baseDelay={0.4}>
        <TimelineEntry
          kind="needs-you"
          status="pending"
          title="Waiting for your approval"
          time="14:22"
          body="The system wants to evict home-assistant from node-02 to free 1.2 GB. This would take your smart home offline for about 3 minutes."
        />
        <div className="ml-8 -mt-3 mb-4">
          <AgentActivity
            status="waiting"
            label="Needs approval to evict home-assistant"
            elapsed="2m"
            onStop={() => {}}
            onExpand={() => {}}
          />
        </div>
      </AnimatedTimeline>
      <AnimatedTimeline index={1} baseDelay={0.4}>
        <TimelineEntry
          kind="regression"
          status="info"
          title="Memory climbed back above 80%"
          time="14:14"
          body="The first rebalance didn't hold. Memory on node-02 returned to 83% within 8 minutes. Taking a different approach."
        />
      </AnimatedTimeline>
      <AnimatedTimeline index={2} baseDelay={0.4}>
        <TimelineEntry
          kind="outcome"
          status="success"
          title="Memory dropped to 68% on both nodes"
          time="14:06"
          body="Rebalance confirmed effective. Entering monitoring."
        />
      </AnimatedTimeline>
      <AnimatedTimeline index={3} baseDelay={0.4}>
        <TimelineEntry
          kind="action"
          status="success"
          title="Moved low-priority workloads to node-01"
          time="14:04"
          body="Rescheduled prometheus-adapter and metrics-server. node-01 has 40% memory headroom."
          commandRun="kubectl cordon node-02 && kubectl drain node-02 --delete-emptydir-data --ignore-daemonsets --pod-selector=priority=low"
        />
        <div className="ml-8 -mt-3 mb-4">
          <AgentActivity
            status="complete"
            label="Rebalanced 3 pods — 6 commands run"
            onExpand={() => {}}
          />
        </div>
      </AnimatedTimeline>
      <AnimatedTimeline index={4} baseDelay={0.4}>
        <TimelineEntry
          kind="analysis"
          status="info"
          title="Identified 3 low-priority pods on node-02"
          time="14:03"
          body="prometheus-adapter, metrics-server, and node-exporter can be safely rescheduled. home-assistant is the largest consumer at 1.2 GB but has no pod disruption budget."
        />
        <div className="ml-8 -mt-3 mb-4">
          <AgentActivity
            status="complete"
            label="Checked allocations — 4 queries"
            onExpand={() => {}}
          />
        </div>
      </AnimatedTimeline>
      <AnimatedTimeline index={5} baseDelay={0.4}>
        <TimelineEntry
          kind="detected"
          status="info"
          title="Memory above 80% on node-02 and node-03"
          time="14:02"
          body="node-02 at 84%, node-03 at 81%. Threshold is 80%. Both nodes have been trending up over the last 20 minutes."
          isLast
        />
      </AnimatedTimeline>
    </div>

    {/* Infrastructure */}
    <SectionLabel delay={0.7}>Infrastructure</SectionLabel>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.75 }}
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
    >
      <ResourceChip kind="node" name="node-02" health="degraded" detail="Memory 83%" />
      <ResourceChip kind="node" name="node-03" health="degraded" detail="Memory 81%" />
      <ResourceChip kind="node" name="node-01" health="healthy" detail="Memory 61%" />
    </motion.div>

    {/* Related */}
    <SectionLabel delay={0.8}>Related</SectionLabel>
    <div>
      <RelatedRow
        title="Elevated API latency on traefik"
        relation="Caused by this"
        stage="Investigation"
        time="2m"
        icon={Eye}
        iconColor="text-amber-400/70"
        delay={0.85}
      />
    </div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════
 * ACTIVE INVESTIGATION — agent is working right now
 * ══════════════════════════════════════════════════════════════════════ */

const ActiveInvestigation = (): React.ReactElement => (
  <Shell>
    {/* Header */}
    <motion.div {...fadeUp} className="mb-6">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h1 className="text-xl font-medium tracking-tight">Elevated API latency on traefik</h1>
        <span className="text-xs text-text-muted font-mono flex-shrink-0">2m</span>
      </div>
      <div className="flex items-center gap-2">
        <StagePill stage="investigation" />
        <Badge variant="info">Agent working</Badge>
      </div>
    </motion.div>

    {/* Summary */}
    <motion.p {...stagger(0, 0.1)} className="text-sm text-text-secondary leading-relaxed">
      API response times spiked to 280ms (normally ~80ms). An agent is investigating
      the root cause.
    </motion.p>

    {/* Timeline */}
    <SectionLabel delay={0.2}>What's happening</SectionLabel>
    <div>
      <AnimatedTimeline index={0} baseDelay={0.25}>
        <TimelineEntry
          kind="analysis"
          status="pending"
          title="Investigating root cause"
          time="14:02"
          body="Checking traefik metrics and correlating with cluster events."
        />
        <div className="ml-8 -mt-3 mb-4">
          <AgentActivity
            status="working"
            label="Analyzing traefik access logs"
            elapsed="18s"
            onStop={() => {}}
            onExpand={() => {}}
          />
        </div>
      </AnimatedTimeline>
      <AnimatedTimeline index={1} baseDelay={0.25}>
        <TimelineEntry
          kind="detected"
          status="info"
          title="API response times at 280ms"
          time="14:00"
          body="Normal baseline is ~80ms. Crossed the 200ms threshold."
          isLast
        />
      </AnimatedTimeline>
    </div>

    {/* Infrastructure */}
    <SectionLabel delay={0.4}>Infrastructure</SectionLabel>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.45 }}
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
    >
      <ResourceChip kind="ingress" name="traefik" health="degraded" detail="280ms p99" />
      <ResourceChip kind="node" name="node-02" health="degraded" detail="Memory 84%" />
    </motion.div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════
 * MONITORING — fix applied, watching if it holds
 * ══════════════════════════════════════════════════════════════════════ */

const Monitoring = (): React.ReactElement => (
  <Shell>
    {/* Header */}
    <motion.div {...fadeUp} className="mb-6">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h1 className="text-xl font-medium tracking-tight">Elevated API latency on traefik</h1>
        <span className="text-xs text-text-muted font-mono flex-shrink-0">1h</span>
      </div>
      <StagePill stage="monitoring" />
    </motion.div>

    {/* Summary */}
    <motion.p {...stagger(0, 0.1)} className="text-sm text-text-secondary leading-relaxed">
      API response times spiked to 280ms (normally ~80ms) during the cluster memory pressure.
      After the memory issue was resolved, latency started dropping. Currently at 120ms and
      trending down. Monitoring for 10 more minutes before marking resolved.
    </motion.p>

    {/* Timeline */}
    <SectionLabel delay={0.2}>What happened</SectionLabel>
    <div>
      <AnimatedTimeline index={0} baseDelay={0.25}>
        <TimelineEntry
          kind="outcome"
          status="pending"
          title="Latency dropping — 120ms and trending down"
          time="15:02"
          body="Monitoring for 10 more minutes to confirm stability before resolving."
        />
      </AnimatedTimeline>
      <AnimatedTimeline index={1} baseDelay={0.25}>
        <TimelineEntry
          kind="analysis"
          status="info"
          title="Root cause identified as memory pressure"
          time="14:30"
          body="traefik's response times correlate directly with node-02 memory usage. No configuration issue — this is purely resource contention."
        />
      </AnimatedTimeline>
      <AnimatedTimeline index={2} baseDelay={0.25}>
        <TimelineEntry
          kind="detected"
          status="info"
          title="API response times at 280ms"
          time="14:00"
          body="Normal baseline is ~80ms. Crossed the 200ms threshold."
          isLast
        />
      </AnimatedTimeline>
    </div>

    {/* Infrastructure */}
    <SectionLabel delay={0.45}>Infrastructure</SectionLabel>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.5 }}
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
    >
      <ResourceChip kind="ingress" name="traefik" health="degraded" detail="120ms p99" />
      <ResourceChip kind="node" name="node-02" health="healthy" detail="Memory 61%" />
    </motion.div>

    {/* Related */}
    <SectionLabel delay={0.55}>Related</SectionLabel>
    <div>
      <RelatedRow
        title="Memory pressure on node-02 and node-03"
        relation="Caused by"
        stage="Implementation"
        time="14m"
        icon={Wrench}
        iconColor="text-blue-400/70"
        delay={0.6}
      />
    </div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════
 * RESOLVED — issue fully handled, the complete story
 * ══════════════════════════════════════════════════════════════════════ */

const Resolved = (): React.ReactElement => (
  <Shell>
    {/* Header */}
    <motion.div {...fadeUp} className="mb-6">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h1 className="text-xl font-medium tracking-tight">CoreDNS entered CrashLoopBackOff</h1>
        <span className="text-xs text-text-muted font-mono flex-shrink-0">25m</span>
      </div>
      <StagePill stage="resolved" />
    </motion.div>

    {/* Summary */}
    <motion.p {...stagger(0, 0.1)} className="text-sm text-text-secondary leading-relaxed">
      The CoreDNS pod in kube-system went into CrashLoopBackOff after a config update.
      The system restarted the pod with the previous stable config. DNS resolution was
      confirmed healthy within 30 seconds.
    </motion.p>

    {/* Timeline */}
    <SectionLabel delay={0.2}>What happened</SectionLabel>
    <div>
      <AnimatedTimeline index={0} baseDelay={0.25}>
        <TimelineEntry
          kind="resolved"
          status="success"
          title="Issue resolved"
          time="14:27"
          body="DNS resolution stable for 5 minutes. Closing."
        />
      </AnimatedTimeline>
      <AnimatedTimeline index={1} baseDelay={0.25}>
        <TimelineEntry
          kind="outcome"
          status="success"
          title="DNS resolution confirmed healthy"
          time="14:22"
          body="All internal and external queries returning in under 5ms."
        />
      </AnimatedTimeline>
      <AnimatedTimeline index={2} baseDelay={0.25}>
        <TimelineEntry
          kind="action"
          status="success"
          title="Restarted CoreDNS with previous stable config"
          time="14:20"
          commandRun="kubectl rollout undo deployment/coredns -n kube-system"
        />
      </AnimatedTimeline>
      <AnimatedTimeline index={3} baseDelay={0.25}>
        <TimelineEntry
          kind="analysis"
          status="info"
          title="CrashLoopBackOff caused by config update"
          time="14:05"
          body="The pod started failing after the latest ConfigMap change. The previous revision was stable for 14 days. Rolling back is the safest path."
        />
      </AnimatedTimeline>
      <AnimatedTimeline index={4} baseDelay={0.25}>
        <TimelineEntry
          kind="detected"
          status="info"
          title="CoreDNS pod in CrashLoopBackOff"
          time="14:02"
          body="coredns-5d78c restarted 3 times in 2 minutes. DNS queries are failing cluster-wide."
          isLast
        />
      </AnimatedTimeline>
    </div>

    {/* Infrastructure */}
    <SectionLabel delay={0.55}>Infrastructure</SectionLabel>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, delay: 0.6 }}
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
    >
      <ResourceChip kind="pod" name="coredns-5d78c" health="healthy" />
      <ResourceChip kind="deployment" name="coredns" health="healthy" />
    </motion.div>

    {/* Resolved footer */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.7 }}
      className="text-center text-xs text-text-muted mt-10 pt-6 border-t border-white/5"
    >
      Resolved 25 minutes ago · Took 25 minutes from detection to close
    </motion.div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Pages/Issue Detail',
  parameters: {
    layout: 'fullscreen',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
}

type Story = StoryObj

const NeedsApproval: Story = { render: InProgressNeedsYou }
const AgentWorking: Story = { render: ActiveInvestigation }
const BeingMonitored: Story = { render: Monitoring }
const FullyResolved: Story = { render: Resolved }

export { NeedsApproval, AgentWorking, BeingMonitored, FullyResolved }
export default meta
