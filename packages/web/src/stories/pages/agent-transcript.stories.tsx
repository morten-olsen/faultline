import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  ArrowLeft, Bot, Square, Clock,
  CheckCircle2, AlertCircle, Hand,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { TranscriptStep } from '../../components/transcript-step/transcript-step.tsx'
import { AgentActivity } from '../../components/agent-activity/agent-activity.tsx'
import { StagePill } from '../../components/stage-pill/stage-pill.tsx'
import { Badge } from '../../components/badge/badge.tsx'
import { Button } from '../../components/button/button.tsx'
import { IconButton } from '../../components/icon-button/icon-button.tsx'

/*
 * Agent Transcript — the full record of an agent's work on a task.
 *
 * This is where the curious user goes to understand exactly what the
 * system did, step by step. Think of it like reading a colleague's
 * notes — you don't have to, but it's there when you want to.
 *
 * The transcript opens from a timeline entry or agent activity indicator.
 * It slides up as a full-page view with a back button to return to the
 * issue detail.
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

/* ── Transcript header ──────────────────────────────────────────── */

type TranscriptHeaderProps = {
  title: string
  stage: string
  status: 'running' | 'complete' | 'stopped'
  elapsed: string
  steps: number
}

const TranscriptHeader = ({ title, stage, status, elapsed, steps }: TranscriptHeaderProps): React.ReactElement => (
  <motion.div {...fadeUp} className="mb-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="relative">
        <Bot size={18} className={status === 'running' ? 'text-blue-400/70' : 'text-text-muted/50'} />
        {status === 'running' && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        )}
      </div>
      <span className="text-xs text-text-muted uppercase tracking-wider">Agent transcript</span>
    </div>

    <h1 className="text-lg font-medium tracking-tight mb-2">{title}</h1>

    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs text-text-muted">{stage}</span>
      <span className="text-xs text-text-muted/30">·</span>
      <div className="flex items-center gap-1.5">
        <Clock size={11} className="text-text-muted/40" />
        <span className="text-xs text-text-muted font-mono">{elapsed}</span>
      </div>
      <span className="text-xs text-text-muted/30">·</span>
      <span className="text-xs text-text-muted">{steps} steps</span>
      {status === 'running' && (
        <Badge variant="info">Running</Badge>
      )}
      {status === 'complete' && (
        <Badge variant="healthy">Complete</Badge>
      )}
      {status === 'stopped' && (
        <Badge>Stopped</Badge>
      )}
    </div>
  </motion.div>
)

/* ── Page shell ────────────────────────────────────────────────────── */

const Shell = ({ children, onBack, showStop = false }: { children: React.ReactNode; onBack?: () => void; showStop?: boolean }): React.ReactElement => (
  <div className="bg-bg min-h-screen font-sans text-text antialiased">
    <div className="max-w-lg mx-auto px-5">
      {/* Nav bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between h-14"
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to issue</span>
        </button>
        {showStop && (
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-red-400 transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-white/4"
          >
            <Square size={10} fill="currentColor" />
            <span>Stop agent</span>
          </button>
        )}
      </motion.div>

      <div className="pt-2 pb-12">
        {children}
      </div>
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════
 * LIVE — agent actively working on memory rebalance
 * ══════════════════════════════════════════════════════════════════════ */

const LiveTranscript = (): React.ReactElement => (
  <Shell showStop>
    <TranscriptHeader
      title="Investigating memory pressure on node-02"
      stage="Investigation"
      status="running"
      elapsed="18s"
      steps={6}
    />

    {/* Transcript steps */}
    <motion.div {...stagger(0, 0.15)} className="bg-surface rounded-xl p-4 ring-1 ring-white/5">
      <TranscriptStep
        kind="thinking"
        title="Memory alert on node-02 — checking current state"
        duration="0.3s"
        detail="Alertmanager fired HighMemoryUsage for node-02. Threshold is 80%, current is unknown. Need to verify and check for correlated issues."
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl top nodes"
        duration="1.2s"
        output={`NAME      CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%\nnode-01   312m         15%    2841Mi          61%\nnode-02   487m         24%    3892Mi          84%\nnode-03   401m         20%    3744Mi          81%`}
        collapsible
        defaultOpen
      />
      <TranscriptStep
        kind="thinking"
        title="node-02 at 84%, node-03 also elevated at 81%"
        duration="0.2s"
        detail="Both nodes are above the 80% threshold. This might be a cluster-wide issue, not just node-02. Checking what's consuming memory on each node."
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl get pods -o wide --sort-by='.containers[0].resources.requests.memory' --field-selector spec.nodeName=node-02"
        duration="0.8s"
        output={`NAME                          READY   MEMORY REQ   NODE\nhome-assistant-0              1/1     1200Mi        node-02\nprometheus-adapter-6d4c       1/1     256Mi         node-02\nmetrics-server-7b8f           1/1     128Mi         node-02\nnode-exporter-x2k9            1/1     64Mi          node-02`}
        collapsible
      />
      <TranscriptStep
        kind="thinking"
        title="3 low-priority pods can be moved — checking node-01 capacity"
        duration="0.1s"
        detail="prometheus-adapter (256Mi), metrics-server (128Mi), node-exporter (64Mi) are all low-priority. Together they use 448Mi. home-assistant is the biggest consumer at 1200Mi but has a PodDisruptionBudget."
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl describe node node-01 | grep -A5 'Allocated resources'"
        status="running"
        isLast
      />
    </motion.div>

    {/* Live indicator at bottom */}
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-4 flex items-center justify-center gap-2 py-3"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
      <span className="text-xs text-text-muted">Agent is working…</span>
    </motion.div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════
 * COMPLETE — fully resolved CoreDNS investigation
 * ══════════════════════════════════════════════════════════════════════ */

const CompletedTranscript = (): React.ReactElement => (
  <Shell>
    <TranscriptHeader
      title="CoreDNS CrashLoopBackOff — diagnosis and rollback"
      stage="Resolved"
      status="complete"
      elapsed="2m 14s"
      steps={8}
    />

    <motion.div {...stagger(0, 0.15)} className="bg-surface rounded-xl p-4 ring-1 ring-white/5">
      <TranscriptStep
        kind="thinking"
        title="CoreDNS pod is in CrashLoopBackOff — checking logs"
        duration="0.2s"
        detail="Pod coredns-5d78c in kube-system has restarted 3 times in 2 minutes. DNS is likely failing cluster-wide. Checking pod logs for the crash reason."
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl logs coredns-5d78c -n kube-system --tail=30"
        duration="0.6s"
        output={`[INFO] plugin/ready: Will not answer queries until all plugins report ready.\n[ERROR] plugin/forward: no nameservers found\n[FATAL] plugin/forward: not able to start\nE0313 14:02:12.123456 1 main.go:42] Error: "forward plugin: unable to parse upstream"`}
        collapsible
        defaultOpen
      />
      <TranscriptStep
        kind="thinking"
        title="Forward plugin can't parse upstream — likely a ConfigMap issue"
        duration="0.1s"
        detail="The error points to the forward plugin's configuration. This usually means the Corefile was edited with invalid upstream DNS syntax. Checking rollout history to see if there was a recent change."
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl rollout history deployment/coredns -n kube-system"
        duration="0.4s"
        output={`deployment.apps/coredns\nREVISION  CHANGE-CAUSE\n1         <none>\n2         configmap update 2026-03-13 13:58`}
        collapsible
      />
      <TranscriptStep
        kind="thinking"
        title="ConfigMap was updated 4 minutes ago — that's the cause"
        duration="0.1s"
        detail="Revision 2 was deployed at 13:58, CoreDNS started crashing at 14:02. The previous revision ran stable for 14 days. Rolling back is the safest and fastest path to restore DNS."
        collapsible
      />
      <TranscriptStep
        kind="message"
        title="Rolling back CoreDNS to revision 1 — the previous stable config"
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl rollout undo deployment/coredns -n kube-system"
        duration="2.1s"
        output="deployment.apps/coredns rolled back"
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="dig @10.96.0.10 kubernetes.default.svc.cluster.local"
        duration="0.3s"
        output={`;; ANSWER SECTION:\nkubernetes.default.svc.cluster.local. 30 IN A 10.96.0.1\n\n;; Query time: 3 msec\n;; SERVER: 10.96.0.10#53(10.96.0.10)\n;; MSG SIZE  rcvd: 117`}
        collapsible
      />
      <TranscriptStep
        kind="message"
        title="DNS is healthy — resolution confirmed in 3ms"
        detail="Rolled back to the previous stable Corefile. The recent ConfigMap change removed the upstream nameserver block, which broke the forward plugin. Will monitor for 5 minutes to confirm stability."
        isLast
      />
    </motion.div>

    {/* Outcome summary */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="mt-6 bg-white/2 rounded-xl p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 size={14} className="text-green-400/60" />
        <span className="text-xs font-medium text-text">Outcome</span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">
        CoreDNS restored by rolling back the deployment. Root cause was an invalid
        ConfigMap update that removed upstream nameserver configuration. DNS queries
        confirmed healthy at 3ms latency.
      </p>
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs text-text-muted font-mono">2m 14s total</span>
        <span className="text-xs text-text-muted/30">·</span>
        <span className="text-xs text-text-muted">8 steps</span>
        <span className="text-xs text-text-muted/30">·</span>
        <span className="text-xs text-text-muted">4 commands run</span>
      </div>
    </motion.div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════
 * NEEDS APPROVAL — agent paused, waiting for user decision
 * ══════════════════════════════════════════════════════════════════════ */

const WaitingForApproval = (): React.ReactElement => (
  <Shell showStop>
    <TranscriptHeader
      title="Memory rebalance — needs approval for eviction"
      stage="Proposed Plan"
      status="running"
      elapsed="1m 42s"
      steps={9}
    />

    <motion.div {...stagger(0, 0.15)} className="bg-surface rounded-xl p-4 ring-1 ring-white/5">
      <TranscriptStep
        kind="thinking"
        title="Memory alert — checking current allocations"
        duration="0.3s"
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl top nodes"
        duration="1.2s"
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl get pods -o wide --field-selector spec.nodeName=node-02"
        duration="0.8s"
        collapsible
      />
      <TranscriptStep
        kind="message"
        title="Rebalancing low-priority workloads to node-01"
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl cordon node-02 && kubectl drain node-02 --pod-selector=priority=low"
        duration="4.2s"
        output="node/node-02 cordoned\nevicting pod default/prometheus-adapter-6d4c\nevicting pod default/metrics-server-7b8f\nevicting pod default/node-exporter-x2k9\npod/prometheus-adapter-6d4c evicted\npod/metrics-server-7b8f evicted\npod/node-exporter-x2k9 evicted"
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl top nodes (post-rebalance)"
        duration="1.0s"
        output={`NAME      CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%\nnode-01   398m         19%    3312Mi          71%\nnode-02   412m         20%    3401Mi          73%\nnode-03   401m         20%    3744Mi          81%`}
        collapsible
      />
      <TranscriptStep
        kind="thinking"
        title="node-02 dropped to 73% but node-03 still at 81%"
        duration="0.2s"
        detail="The rebalance helped node-02 but memory is still elevated across the cluster. The largest single consumer is home-assistant at 1.2 GB on node-02. Evicting it would free significant memory, but it has a PodDisruptionBudget and would take smart home offline."
        collapsible
        defaultOpen
      />
      <TranscriptStep
        kind="error"
        status="failed"
        title="Cannot evict home-assistant — PodDisruptionBudget"
        detail="PodDisruptionBudget 'home-assistant-pdb' requires minAvailable: 1. Cannot proceed without override approval."
      />
      <TranscriptStep
        kind="message"
        title="Need your approval — evicting home-assistant would take smart home offline for ~3 minutes"
        detail="This is the most effective remaining option. home-assistant will restart automatically on a node with available memory. Your smart home automations will pause briefly."
        isLast
      />
    </motion.div>

    {/* Approval card */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.35 }}
      className="mt-4 bg-white/3 ring-1 ring-amber-500/12 rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Hand size={15} className="text-amber-400/80" />
        <span className="text-sm font-medium text-text">Approve evicting home-assistant?</span>
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">
        Your smart home will be offline for about 3 minutes while the pod
        reschedules. All automations resume automatically.
      </p>
      <div className="flex items-center gap-2 pt-1">
        <Button variant="primary" size="sm">Approve</Button>
        <Button variant="ghost" size="sm">Deny — find another way</Button>
      </div>
    </motion.div>

    {/* Waiting indicator */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="mt-4 flex items-center justify-center gap-2 py-3"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-xs text-text-muted">Waiting for your decision…</span>
    </motion.div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════
 * STOPPED — user stopped the agent mid-work
 * ══════════════════════════════════════════════════════════════════════ */

const StoppedTranscript = (): React.ReactElement => (
  <Shell>
    <TranscriptHeader
      title="Investigating elevated API latency"
      stage="Investigation"
      status="stopped"
      elapsed="32s"
      steps={4}
    />

    <motion.div {...stagger(0, 0.15)} className="bg-surface rounded-xl p-4 ring-1 ring-white/5">
      <TranscriptStep
        kind="thinking"
        title="API latency at 280ms — checking traefik metrics"
        duration="0.3s"
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl top pod -n traefik"
        duration="0.9s"
        output={`NAME                       CPU(cores)   MEMORY(bytes)\ntraefik-7d9bc5c94-x2k9    89m          124Mi`}
        collapsible
      />
      <TranscriptStep
        kind="tool-call"
        title="kubectl logs traefik-7d9bc5c94-x2k9 -n traefik --tail=50"
        duration="1.4s"
        collapsible
      />
      <TranscriptStep
        kind="thinking"
        title="Correlating with node memory pressure—"
        status="failed"
        detail="Agent stopped by user."
        isLast
      />
    </motion.div>

    {/* Stopped notice */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-6 bg-white/2 rounded-xl p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <AlertCircle size={14} className="text-text-muted/40" />
        <span className="text-xs font-medium text-text-muted">Stopped by you</span>
      </div>
      <p className="text-sm text-text-muted leading-relaxed">
        The agent was investigating API latency when you stopped it. The issue
        remains open and can be picked up again.
      </p>
      <div className="pt-2">
        <Button variant="secondary" size="sm">Resume investigation</Button>
      </div>
    </motion.div>
  </Shell>
)

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Pages/Agent Transcript',
  parameters: {
    layout: 'fullscreen',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
}

type Story = StoryObj

const Live: Story = { render: LiveTranscript }
const Complete: Story = { render: CompletedTranscript }
const NeedsApproval: Story = { render: WaitingForApproval }
const Stopped: Story = { render: StoppedTranscript }

export { Live, Complete, NeedsApproval, Stopped }
export default meta
