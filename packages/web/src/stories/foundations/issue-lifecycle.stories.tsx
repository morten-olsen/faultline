import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  CircleCheck, Eye, Wrench, Search, Hand, ListChecks,
  ArrowRight, ArrowDown, Lightbulb, RotateCcw, UserCheck,
} from 'lucide-react'
import { motion } from 'motion/react'
import { StagePill } from '../../components/stage-pill/stage-pill.tsx'
import { Button } from '../../components/button/button.tsx'
import { TimelineEntry } from '../../components/timeline-entry/timeline-entry.tsx'
import { ResourceChip } from '../../components/resource-chip/resource-chip.tsx'

/*
 * The Issue Lifecycle — a single scrollable walkthrough showing
 * one issue flowing through the complete pipeline.
 *
 * This is the narrative centerpiece of the design system.
 * It shows how the same issue looks at every stage, across
 * every page, using our real components.
 */

/* ── Animation ────────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
}

const stagger = (i: number, base = 0) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay: base + i * 0.06 },
})

/* ── Stage transition arrow ───────────────────────────────────────── */

const StageTransition = ({ from, to, reason }: { from: string; to: string; reason: string }): React.ReactElement => (
  <motion.div {...stagger(0, 0.1)} style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, padding: '2rem 0', color: '#5a5a5a',
  }}>
    <ArrowDown size={16} style={{ opacity: 0.3 }} />
    <div style={{
      fontSize: '0.6875rem', textAlign: 'center',
      fontFamily: '"Geist Mono Variable", monospace',
      maxWidth: 300, lineHeight: 1.5,
    }}>
      {from} → {to}
    </div>
    <div style={{ fontSize: '0.75rem', textAlign: 'center', maxWidth: 360, lineHeight: 1.5 }}>
      {reason}
    </div>
  </motion.div>
)

/* ── Chapter heading ──────────────────────────────────────────────── */

type ChapterProps = {
  number: string
  title: string
  desc: string
  color: string
  icon: typeof Wrench
}

const Chapter = ({ number, title, desc, color, icon: Icon }: ChapterProps): React.ReactElement => (
  <motion.div {...fadeUp} style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <span style={{
        fontSize: '0.6875rem', fontFamily: '"Geist Mono Variable", monospace',
        color: '#5a5a5a',
      }}>{number}</span>
      <Icon size={16} style={{ color, opacity: 0.8 }} />
      <h2 style={{ fontSize: '1.25rem', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
    </div>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0, maxWidth: 520 }}>{desc}</p>
  </motion.div>
)

/* ── Mini home row (how it looks on the home page) ────────────────── */

type HomeRowProps = {
  title: string
  summary: string
  time: string
  icon: typeof Wrench
  iconColor: string
  stageLabel: string
  needsYou?: boolean
  index?: number
}

const HomeRow = ({ title, summary, time, icon: Icon, iconColor, stageLabel, needsYou, index = 0 }: HomeRowProps): React.ReactElement => (
  <motion.div {...stagger(index, 0.15)} style={{
    display: 'flex', alignItems: 'start', gap: 10, padding: '10px 12px',
    background: needsYou ? 'rgba(245,158,11,0.03)' : 'rgba(255,255,255,0.02)',
    borderRadius: 10, border: needsYou ? '1px solid rgba(245,158,11,0.1)' : '1px solid rgba(255,255,255,0.04)',
  }}>
    <div style={{ marginTop: 2 }}>
      <Icon size={14} style={{ color: iconColor, opacity: 0.8 }} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: '0.6875rem', color: '#5a5a5a', fontFamily: '"Geist Mono Variable", monospace', flexShrink: 0 }}>{time}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
        <span style={{ fontSize: '0.6875rem', color: iconColor }}>{stageLabel}</span>
        <span style={{ fontSize: '0.6875rem', color: '#5a5a5a', opacity: 0.4 }}>·</span>
        <span style={{ fontSize: '0.6875rem', color: '#5a5a5a' }}>{summary}</span>
      </div>
    </div>
  </motion.div>
)

/* ── Section labels ───────────────────────────────────────────────── */

const Label = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div style={{
    color: '#5a5a5a', fontSize: '0.6rem', fontWeight: 500,
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: 8, marginTop: 20,
  }}>
    {children}
  </div>
)

/* ── The lifecycle story ──────────────────────────────────────────── */

const LifecycleStory = (): React.ReactElement => (
  <div style={{ maxWidth: 640, margin: '0 auto', color: '#e8e8e8' }}>
    <motion.div {...fadeUp}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 6 }}>
        The Issue Lifecycle
      </h1>
      <p style={{ color: '#a3a3a3', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 8, maxWidth: 520 }}>
        Follow one issue — memory pressure on a Kubernetes node — from the moment
        the system detects it to the moment it's resolved. At each stage, see how
        the interface adapts: what the home page shows, what the detail page reveals,
        and what the user experiences.
      </p>
      <p style={{ color: '#5a5a5a', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: 32 }}>
        This is the story of how Faultline works. Every component, every color choice,
        every animation exists to serve this flow.
      </p>
    </motion.div>

    {/* ── 1. TRIAGE ── */}
    <Chapter
      number="01"
      title="Triage"
      desc="14:02 — The system notices memory on node-02 has crossed 80%. An issue is created and enters triage to assess severity."
      color="#fbbf24"
      icon={Search}
    />

    <Label>On the home page</Label>
    <HomeRow
      title="Memory above 80% on node-02"
      summary="Threshold crossed. Assessing."
      time="just now"
      icon={Search}
      iconColor="#fbbf24"
      stageLabel="Triage"
    />

    <Label>First timeline entry</Label>
    <motion.div {...stagger(0, 0.2)}>
      <TimelineEntry
        kind="detected"
        status="info"
        title="Memory above 80% on node-02"
        time="14:02"
        body="node-02 at 84%. Threshold is 80%. Trending up over the last 20 minutes."
        isLast
      />
    </motion.div>

    <StageTransition
      from="Triage"
      to="Investigation"
      reason="Severity confirmed. System begins analyzing root cause."
    />

    {/* ── 2. INVESTIGATION ── */}
    <Chapter
      number="02"
      title="Investigation"
      desc="14:03 — The system is analyzing what's consuming memory and what can be safely moved."
      color="#60a5fa"
      icon={Lightbulb}
    />

    <Label>On the home page</Label>
    <HomeRow
      title="Memory pressure on node-02"
      summary="Analyzing workload distribution."
      time="1m"
      icon={Lightbulb}
      iconColor="#60a5fa"
      stageLabel="Investigation"
    />

    <Label>Timeline — analysis in progress</Label>
    <motion.div {...stagger(0, 0.15)}>
      <TimelineEntry
        kind="analysis"
        status="info"
        title="Identified 3 low-priority pods on node-02"
        time="14:03"
        body="prometheus-adapter, metrics-server, and node-exporter can be safely rescheduled. home-assistant is the largest consumer at 1.2 GB but has no pod disruption budget."
        isLast
      />
    </motion.div>

    <StageTransition
      from="Investigation"
      to="Proposed Plan"
      reason="Root cause understood. System has a safe remediation plan."
    />

    {/* ── 3. PROPOSED PLAN ── */}
    <Chapter
      number="03"
      title="Proposed Plan"
      desc="14:03 — The system has a plan: move low-priority pods to node-01. This is safe enough to execute automatically."
      color="#60a5fa"
      icon={ListChecks}
    />

    <motion.div {...stagger(0, 0.1)} style={{
      background: '#141414', borderRadius: 10, padding: '12px 14px', marginBottom: 16,
    }}>
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>
        Not every plan needs approval. Safe, reversible actions (moving low-priority pods)
        proceed automatically. Disruptive plans (evicting home-assistant) pause here and
        flag <strong style={{ color: '#e8e8e8' }}>Needs you</strong>. The system knows the difference.
      </p>
    </motion.div>

    <Label>On the detail page</Label>
    <motion.div {...stagger(0, 0.2)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <StagePill stage="proposed-plan" />
    </motion.div>

    <StageTransition
      from="Proposed Plan"
      to="Implementation"
      reason="Plan is safe and reversible — proceeding automatically."
    />

    {/* ── 4. IMPLEMENTATION ── */}
    <Chapter
      number="04"
      title="Implementation"
      desc="14:04 — The system is executing the plan: cordoning node-02 and draining low-priority pods."
      color="#60a5fa"
      icon={Wrench}
    />

    <Label>On the home page</Label>
    <HomeRow
      title="Memory pressure on node-02"
      summary="Moving low-priority workloads to node-01."
      time="2m"
      icon={Wrench}
      iconColor="#60a5fa"
      stageLabel="Implementation"
    />

    <Label>Timeline — action executed</Label>
    <motion.div {...stagger(0, 0.15)}>
      <TimelineEntry
        kind="action"
        status="success"
        title="Moved low-priority workloads to node-01"
        time="14:04"
        commandRun="kubectl cordon node-02 && kubectl drain node-02 --pod-selector=priority=low"
        isLast
      />
    </motion.div>

    <StageTransition
      from="Implementation"
      to="Monitoring"
      reason="Fix applied. Memory dropping. Watching to see if it holds."
    />

    {/* ── 5. MONITORING ── */}
    <Chapter
      number="05"
      title="Monitoring"
      desc="14:06 — Memory dropped to 68%. The system is watching to make sure the fix holds before declaring victory."
      color="#4ade80"
      icon={Eye}
    />

    <Label>On the home page</Label>
    <HomeRow
      title="Memory pressure on node-02"
      summary="Moved low-priority workloads. Watching memory settle."
      time="4m"
      icon={Eye}
      iconColor="#4ade80"
      stageLabel="Monitoring"
    />

    <Label>Infrastructure shows improvement</Label>
    <motion.div {...stagger(0, 0.15)} style={{ display: 'flex', gap: 8 }}>
      <ResourceChip kind="node" name="node-02" health="healthy" detail="Memory 68%" />
      <ResourceChip kind="node" name="node-01" health="healthy" detail="Memory 59%" />
    </motion.div>

    <StageTransition
      from="Monitoring"
      to="Investigation (regression)"
      reason="Memory climbed back above 80% within 8 minutes. The fix didn't hold."
    />

    {/* ── 6. REGRESSION ── */}
    <Chapter
      number="06"
      title="Regression"
      desc="14:14 — The fix didn't hold. Memory climbed back. The system re-enters the pipeline at Investigation."
      color="#fbbf24"
      icon={RotateCcw}
    />

    <motion.div {...stagger(0, 0.1)} style={{
      background: '#141414', borderRadius: 10, padding: '12px 14px', marginBottom: 16,
    }}>
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>
        Regressions are honest. The system doesn't pretend a problem is solved when it isn't.
        The issue reappears in the pipeline with a <span style={{ color: '#fbbf24' }}>Regressed</span> badge —
        visible proof that the system tried, failed, and is trying again. It re-enters at
        Investigation to analyze what went wrong.
      </p>
    </motion.div>

    <Label>On the home page — status line changes</Label>
    <motion.div {...stagger(0, 0.15)} style={{
      background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 16px',
      border: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '1.125rem', fontWeight: 500, letterSpacing: '-0.02em' }}>All being handled</span>
        <Lightbulb size={16} style={{ color: '#60a5fa', opacity: 0.7 }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: '#5a5a5a' }}>Memory issue resurfaced. Re-investigating.</span>
    </motion.div>

    <Label>Timeline records the regression</Label>
    <motion.div {...stagger(0, 0.15)}>
      <TimelineEntry
        kind="regression"
        status="info"
        title="Memory climbed back above 80%"
        time="14:14"
        body="The first rebalance didn't hold. Memory on node-02 returned to 83% within 8 minutes."
        isLast
      />
    </motion.div>

    <StageTransition
      from="Investigation"
      to="Proposed Plan (needs you)"
      reason="The system has a new plan but it's disruptive. It needs approval."
    />

    {/* ── 7. PROPOSED PLAN + NEEDS YOU ── */}
    <Chapter
      number="07"
      title="Proposed Plan — Needs you"
      desc="14:22 — The system's new plan is to evict home-assistant. It's effective but disruptive, so it pauses and asks."
      color="#fbbf24"
      icon={Hand}
    />

    <motion.div {...stagger(0, 0.1)} style={{
      background: '#141414', borderRadius: 10, padding: '12px 14px', marginBottom: 16,
    }}>
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>
        <strong style={{ color: '#e8e8e8' }}>This is not an error.</strong> The system is asking,
        not alarming. The amber tone and <Hand size={11} style={{ color: '#fbbf24', display: 'inline', verticalAlign: 'middle' }} /> hand
        icon say "hey, when you get a moment" — not "CRITICAL ALERT." The user on the metro
        can approve with their thumb and put their phone away.
      </p>
    </motion.div>

    <Label>On the home page — the needs-you card</Label>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(245,158,11,0.12)',
        borderRadius: 12, padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Hand size={15} style={{ color: '#fbbf24', opacity: 0.8 }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Persistent memory pressure across cluster</span>
        <span style={{ fontSize: '0.6875rem', color: '#5a5a5a', fontFamily: '"Geist Mono Variable", monospace', marginLeft: 'auto' }}>8m</span>
      </div>
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: '0 0 12px' }}>
        Memory has been above 80% for over an hour despite rebalancing. The best fix is to evict
        home-assistant temporarily — your smart home would be offline for about 3 minutes.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" size="sm">Approve</Button>
        <Button variant="ghost" size="sm" iconRight={ArrowRight}>Details</Button>
      </div>
    </motion.div>

    <Label>On the detail page — full context</Label>
    <motion.div {...stagger(0, 0.2)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <StagePill stage="proposed-plan" needsYou />
    </motion.div>
    <motion.div {...stagger(0, 0.2)}>
      <TimelineEntry
        kind="needs-you"
        status="pending"
        title="Waiting for your approval"
        time="14:22"
        body="The system wants to evict home-assistant from node-02 to free 1.2 GB. Your smart home would be offline for about 3 minutes."
        isLast
      />
    </motion.div>

    <StageTransition
      from="Approved"
      to="Implementation → Monitoring → Resolved"
      reason="User approves. System evicts home-assistant. Memory drops. Monitoring confirms stability."
    />

    {/* ── 8. RESOLVED ── */}
    <Chapter
      number="08"
      title="Resolved"
      desc="14:52 — Memory stable for 10 minutes. Issue closes automatically. It moves to the quiet log."
      color="#22c55e"
      icon={CircleCheck}
    />

    <Label>On the home page — shifts to the "Today" log</Label>
    <motion.div {...stagger(0, 0.15)} style={{
      display: 'flex', alignItems: 'start', gap: 10, padding: '8px 12px',
      background: 'rgba(255,255,255,0.02)', borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ marginTop: 2 }}>
        <CircleCheck size={13} style={{ color: '#22c55e', opacity: 0.4 }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.8125rem', color: '#a3a3a3' }}>Memory pressure on node-02</span>
          <span style={{ fontSize: '0.6875rem', color: '#5a5a5a', fontFamily: '"Geist Mono Variable", monospace' }}>50m</span>
        </div>
        <span style={{ fontSize: '0.6875rem', color: '#5a5a5a', marginTop: 2, display: 'block' }}>
          Evicted home-assistant. Memory stable at 58%.
        </span>
      </div>
    </motion.div>

    <motion.div {...stagger(0, 0.2)} style={{
      background: '#141414', borderRadius: 10, padding: '12px 14px', marginTop: 16,
    }}>
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: 0 }}>
        Lower visual weight. The title uses secondary color. The checkmark is translucent.
        Everything says: "this is history, not action." Over weeks and months, the resolved log
        becomes the reason the user stops checking — they've seen enough to trust the system.
      </p>
    </motion.div>

    <Label>The resolved footer</Label>
    <motion.div {...stagger(0, 0.2)} style={{
      textAlign: 'center', color: '#5a5a5a', fontSize: '0.75rem',
      padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.05)',
    }}>
      Resolved 50 minutes ago · Took 50 minutes from detection to close
    </motion.div>

    {/* ── Coda ── */}
    <motion.div {...stagger(0, 0.3)} style={{ margin: '48px 0 0', borderTop: '1px solid #1c1c1c', paddingTop: 32 }}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: 8 }}>The complete timeline</h3>
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: 20, maxWidth: 480 }}>
        Every step the system took is visible. The user can trace the full story
        from detection to resolution. Nothing is hidden. This is how trust is built.
      </p>
    </motion.div>

    <div>
      {[
        { kind: 'resolved' as const, status: 'success' as const, title: 'Issue resolved', time: '14:52', body: 'Memory stable for 10 minutes. Closing.' },
        { kind: 'outcome' as const, status: 'success' as const, title: 'Memory dropped to 58%', time: '14:42', body: 'home-assistant evicted. Memory stabilized.' },
        { kind: 'action' as const, status: 'success' as const, title: 'Evicted home-assistant from node-02', time: '14:40', commandRun: 'kubectl delete pod home-assistant-0 -n home --grace-period=30' },
        { kind: 'user-action' as const, status: 'success' as const, title: 'User approved eviction', time: '14:38' },
        { kind: 'needs-you' as const, status: 'pending' as const, title: 'Waiting for approval — evict home-assistant?', time: '14:22', body: 'Plan is disruptive. Needs human approval.' },
        { kind: 'analysis' as const, status: 'info' as const, title: 'New plan: evict home-assistant to free 1.2 GB', time: '14:18', body: 'Safe options exhausted. This is the most effective remaining option.' },
        { kind: 'regression' as const, status: 'info' as const, title: 'Memory climbed back above 80%', time: '14:14', body: 'First rebalance didn\'t hold.' },
        { kind: 'outcome' as const, status: 'success' as const, title: 'Memory dropped to 68%', time: '14:06', body: 'Rebalance confirmed effective. Entering monitoring.' },
        { kind: 'action' as const, status: 'success' as const, title: 'Moved low-priority workloads to node-01', time: '14:04', commandRun: 'kubectl cordon node-02 && kubectl drain node-02 --pod-selector=priority=low' },
        { kind: 'analysis' as const, status: 'info' as const, title: 'Identified 3 movable low-priority pods', time: '14:03', body: 'prometheus-adapter, metrics-server, node-exporter. Safe to reschedule.' },
        { kind: 'detected' as const, status: 'info' as const, title: 'Memory above 80% on node-02', time: '14:02', body: 'node-02 at 84%. Threshold is 80%.' },
      ].map((entry, i, arr) => (
        <motion.div key={entry.time + entry.title} {...stagger(i, 0.35)}>
          <TimelineEntry
            {...entry}
            isLast={i === arr.length - 1}
          />
        </motion.div>
      ))}
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Foundations/Issue Lifecycle',
  parameters: {
    layout: 'padded',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
}

type Story = StoryObj

const Walkthrough: Story = { render: LifecycleStory }

export { Walkthrough }
export default meta
