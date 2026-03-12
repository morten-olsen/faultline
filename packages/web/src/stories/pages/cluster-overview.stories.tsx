import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  CircleCheck, Eye, Wrench, Search, Hand,
  ArrowRight, Lightbulb, ListChecks,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '../../components/button/button.tsx'
import { TopBar } from '../../components/top-bar/top-bar.tsx'

/*
 * Home — the single-glance view.
 *
 * Information hierarchy:
 *   1. Is everything okay?          → Status line
 *   2. Do I need to do anything?    → Needs-you cards (calm, not alarming)
 *   3. What's currently happening?  → Ongoing issues
 *   4. What happened?               → Recent activity
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

/* ── Stage config ──────────────────────────────────────────────────── */

const stageIcon = {
  resolved: CircleCheck,
  monitoring: Eye,
  implementation: Wrench,
  'proposed-plan': ListChecks,
  investigation: Lightbulb,
  triage: Search,
} as const

const stageColor = {
  resolved: 'text-green-500/50',
  monitoring: 'text-green-400/70',
  implementation: 'text-blue-400/70',
  'proposed-plan': 'text-blue-400/70',
  investigation: 'text-blue-400/70',
  triage: 'text-amber-400/70',
} as const

const stageLabel = {
  monitoring: 'Monitoring',
  implementation: 'Implementation',
  'proposed-plan': 'Proposed plan',
  investigation: 'Investigation',
  triage: 'Triage',
} as const

type Stage = keyof typeof stageIcon
type ActiveStage = Exclude<Stage, 'resolved'>

/* ── Ongoing issue row ─────────────────────────────────────────────── */

type OngoingProps = {
  title: string
  summary: string
  time: string
  stage: ActiveStage
  index: number
  baseDelay?: number
}

const OngoingRow = ({ title, summary, time, stage, index, baseDelay = 0 }: OngoingProps): React.ReactElement => {
  const Icon = stageIcon[stage]
  return (
    <motion.div {...stagger(index, baseDelay)} className="group flex items-start gap-3 py-3 -mx-2 px-2 rounded-lg cursor-pointer hover:bg-white/3 transition-colors">
      <div className="mt-0.5 flex-shrink-0">
        <Icon size={15} className={stageColor[stage]} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-text group-hover:text-white transition-colors truncate">{title}</span>
          <span className="text-xs text-text-muted font-mono flex-shrink-0">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-xs ${stageColor[stage]}`}>{stageLabel[stage]}</span>
          <span className="text-xs text-text-muted/40">·</span>
          <span className="text-xs text-text-muted">{summary}</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Resolved row ──────────────────────────────────────────────────── */

type ResolvedProps = {
  title: string
  summary: string
  time: string
  index: number
  baseDelay?: number
}

const ResolvedRow = ({ title, summary, time, index, baseDelay = 0 }: ResolvedProps): React.ReactElement => (
  <motion.div {...stagger(index, baseDelay)} className="group flex items-start gap-3 py-2.5 -mx-2 px-2 rounded-lg cursor-pointer hover:bg-white/3 transition-colors">
    <div className="mt-0.5 flex-shrink-0">
      <CircleCheck size={14} className="text-green-500/40" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-text-secondary group-hover:text-text transition-colors truncate">{title}</span>
        <span className="text-xs text-text-muted font-mono flex-shrink-0">{time}</span>
      </div>
      <p className="text-xs text-text-muted mt-0.5">{summary}</p>
    </div>
  </motion.div>
)

/* ── Needs-you card ────────────────────────────────────────────────── *
 * NOT an alarm. A colleague asking for help.                          *
 * Amber/warm tone, not red. Gentle elevation, not a siren.           *
 * ──────────────────────────────────────────────────────────────────── */

type NeedsYouCardProps = {
  title: string
  reason: string
  action: string
  time: string
  delay?: number
}

const NeedsYouCard = ({ title, reason, action, time, delay = 0.15 }: NeedsYouCardProps): React.ReactElement => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay }}
    className="bg-white/3 ring-1 ring-amber-500/15 rounded-xl p-4 space-y-3"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Hand size={15} className="text-amber-400/80 flex-shrink-0" />
        <span className="text-sm font-medium text-text truncate">{title}</span>
      </div>
      <span className="text-xs text-text-muted font-mono flex-shrink-0">{time}</span>
    </div>
    <p className="text-sm text-text-secondary leading-relaxed">{reason}</p>
    <div className="flex items-center gap-2">
      <Button variant="primary" size="sm">{action}</Button>
      <Button variant="ghost" size="sm" iconRight={ArrowRight}>Details</Button>
    </div>
  </motion.div>
)

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
    className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1 mt-8"
  >
    {children}
  </motion.div>
)

/* ── Page shell ────────────────────────────────────────────────────── */

const Shell = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div className="bg-bg min-h-screen font-sans text-text antialiased">
    <div className="max-w-lg mx-auto px-5">
      <TopBar />
      <div className="pt-8 pb-12">
        {children}
      </div>
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════
 * HEALTHY — nothing happening, everything handled
 * ══════════════════════════════════════════════════════════════════════ */

const HomeHealthy = (): React.ReactElement => (
  <Shell>
    <motion.div {...fadeUp} className="flex items-center gap-2.5 mb-1">
      <h1 className="text-2xl font-medium tracking-tight">All clear</h1>
      <CircleCheck size={18} className="text-green-500/70" />
    </motion.div>
    <motion.p {...stagger(0, 0.08)} className="text-sm text-text-muted mb-6">5 issues handled today, all automatic.</motion.p>

    <SectionLabel delay={0.15}>Today</SectionLabel>
    <div>
      <ResolvedRow index={0} baseDelay={0.2} title="CoreDNS entered CrashLoopBackOff" summary="Restarted the pod. DNS confirmed healthy." time="14m" />
      <ResolvedRow index={1} baseDelay={0.2} title="Node-03 memory above 85%" summary="Moved workloads to node-01. Memory at 62%." time="1h" />
      <ResolvedRow index={2} baseDelay={0.2} title="Ingress TLS cert expiring in 7 days" summary="Renewed wildcard cert. 90 day expiry." time="2h" />
      <ResolvedRow index={3} baseDelay={0.2} title="AP-Living-Room firmware outdated" summary="Updated UniFi AP to 6.6.77." time="3h" />
      <ResolvedRow index={4} baseDelay={0.2} title="Nightly backup" summary="All persistent volumes snapshotted. 12.4 GB." time="6h" />
    </div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════
 * ACTIVE — one thing needs you, system handling the rest
 * ══════════════════════════════════════════════════════════════════════ */

const HomeActive = (): React.ReactElement => (
  <Shell>
    <motion.div {...fadeUp} className="flex items-center gap-2.5 mb-1">
      <h1 className="text-2xl font-medium tracking-tight">1 thing needs you</h1>
    </motion.div>
    <motion.p {...stagger(0, 0.08)} className="text-sm text-text-muted mb-6">2 more being handled.</motion.p>

    <NeedsYouCard
      title="NAS disk showing SMART warnings"
      reason="Disk 3 is reporting reallocated sectors. The array is degraded but online — writes shifted to other disks. This needs a physical swap."
      action="I'll replace it"
      time="12m"
    />

    <SectionLabel delay={0.35}>Ongoing</SectionLabel>
    <div>
      <OngoingRow
        index={0} baseDelay={0.4}
        title="Memory pressure on node-02 and node-03"
        summary="Moved low-priority workloads. Watching memory settle."
        time="3m"
        stage="monitoring"
      />
      <OngoingRow
        index={1} baseDelay={0.4}
        title="Elevated API latency on traefik"
        summary="280ms, normally ~80ms. Likely tied to memory pressure."
        time="2m"
        stage="investigation"
      />
    </div>

    <SectionLabel delay={0.55}>Today</SectionLabel>
    <div>
      <ResolvedRow index={0} baseDelay={0.6} title="CoreDNS entered CrashLoopBackOff" summary="Restarted the pod. DNS healthy." time="25m" />
      <ResolvedRow index={1} baseDelay={0.6} title="Ingress TLS cert renewed" summary="Wildcard cert. 90 day expiry." time="2h" />
      <ResolvedRow index={2} baseDelay={0.6} title="Nightly backup" summary="All PVCs snapshotted." time="6h" />
    </div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════
 * REGRESSION — a fix didn't hold, system re-investigating
 * ══════════════════════════════════════════════════════════════════════ */

const HomeRegression = (): React.ReactElement => (
  <Shell>
    <motion.div {...fadeUp} className="flex items-center gap-2.5 mb-1">
      <h1 className="text-2xl font-medium tracking-tight">All being handled</h1>
      <Wrench size={18} className="text-blue-400/70" />
    </motion.div>
    <motion.p {...stagger(0, 0.08)} className="text-sm text-text-muted mb-6">2 issues open. Memory issue resurfaced.</motion.p>

    <SectionLabel delay={0.15}>Ongoing</SectionLabel>
    <div>
      <OngoingRow
        index={0} baseDelay={0.2}
        title="Memory pressure on node-02 and node-03"
        summary="Resurfaced — back above 80%. Trying a different approach."
        time="1m"
        stage="implementation"
      />
      <OngoingRow
        index={1} baseDelay={0.2}
        title="Elevated API latency on traefik"
        summary="Still at 310ms. Holding until memory settles."
        time="4m"
        stage="investigation"
      />
    </div>

    <SectionLabel delay={0.35}>Today</SectionLabel>
    <div>
      <ResolvedRow index={0} baseDelay={0.4} title="CoreDNS entered CrashLoopBackOff" summary="Restarted the pod. DNS healthy." time="30m" />
      <ResolvedRow index={1} baseDelay={0.4} title="NAS disk SMART warnings" summary="User swapped disk 3. Array rebuilding." time="1h" />
      <ResolvedRow index={2} baseDelay={0.4} title="Ingress TLS cert renewed" summary="Renewed wildcard cert." time="3h" />
      <ResolvedRow index={3} baseDelay={0.4} title="Nightly backup" summary="All PVCs snapshotted." time="6h" />
    </div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════
 * APPROVAL — system needs permission to proceed
 * ══════════════════════════════════════════════════════════════════════ */

const HomeApproval = (): React.ReactElement => (
  <Shell>
    <motion.div {...fadeUp} className="flex items-center gap-2.5 mb-1">
      <h1 className="text-2xl font-medium tracking-tight">1 thing needs you</h1>
    </motion.div>
    <motion.p {...stagger(0, 0.08)} className="text-sm text-text-muted mb-6">1 more being monitored.</motion.p>

    <NeedsYouCard
      title="Persistent memory pressure across cluster"
      reason="Memory has been above 80% for over an hour despite rebalancing. The best fix is to evict home-assistant temporarily — your smart home would be offline for about 3 minutes."
      action="Approve"
      time="8m"
    />

    <SectionLabel delay={0.35}>Ongoing</SectionLabel>
    <div>
      <OngoingRow
        index={0} baseDelay={0.4}
        title="Elevated API latency on traefik"
        summary="Still at 290ms. Holding for memory issue to resolve."
        time="1h"
        stage="monitoring"
      />
    </div>

    <SectionLabel delay={0.5}>Today</SectionLabel>
    <div>
      <ResolvedRow index={0} baseDelay={0.55} title="NAS disk SMART warnings" summary="User swapped disk. Array rebuilding." time="1h" />
      <ResolvedRow index={1} baseDelay={0.55} title="CoreDNS CrashLoopBackOff" summary="Restarted. DNS healthy." time="2h" />
      <ResolvedRow index={2} baseDelay={0.55} title="Nightly backup" summary="All PVCs snapshotted." time="6h" />
    </div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Pages/Home',
  parameters: {
    layout: 'fullscreen',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
}

type Story = StoryObj

const Healthy: Story = { render: HomeHealthy }
const Active: Story = { render: HomeActive }
const Regression: Story = { render: HomeRegression }
const Approval: Story = { render: HomeApproval }

export { Healthy, Active, Regression, Approval }
export default meta
