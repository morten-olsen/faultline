import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'motion/react'
import { TranscriptStep } from '../../components/transcript-step/transcript-step.tsx'

/*
 * TranscriptStep — one step in an agent's work.
 *
 * The agent thinks, calls tools, receives results, sends messages.
 * Each step is a line in the transcript. Most are collapsed —
 * the user expands what they're curious about.
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
    <div className="bg-surface rounded-xl p-4 ring-1 ring-white/5">
      {children}
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════
 * ALL KINDS — each step kind with its icon and color
 * ══════════════════════════════════════════════════════════════════════ */

const AllKinds = (): React.ReactElement => (
  <div className="bg-bg min-h-screen font-sans text-text antialiased p-8">
    <div className="max-w-xl mx-auto space-y-8">

      <ShowcaseCard label="Thinking">
        <TranscriptStep
          kind="thinking"
          title="Analyzing memory usage patterns across nodes"
          detail="Comparing current allocations against historical baselines. node-02 has been trending upward for 3 hours."
          collapsible
          defaultOpen
          isLast
        />
      </ShowcaseCard>

      <ShowcaseCard label="Tool call">
        <TranscriptStep
          kind="tool-call"
          title="kubectl top nodes"
          duration="1.2s"
          output={`NAME      CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%\nnode-01   312m         15%    2841Mi          61%\nnode-02   487m         24%    3892Mi          84%\nnode-03   401m         20%    3744Mi          81%`}
          collapsible
          defaultOpen
          isLast
        />
      </ShowcaseCard>

      <ShowcaseCard label="Tool result">
        <TranscriptStep
          kind="tool-result"
          title="Fetched pod resource requests for node-02"
          detail="12 pods, 3 marked as low-priority. home-assistant is the largest at 1.2 GB requested."
          collapsible
          isLast
        />
      </ShowcaseCard>

      <ShowcaseCard label="Message">
        <TranscriptStep
          kind="message"
          title="Memory on node-02 is at 84%, above the 80% threshold"
          detail="I'll attempt to rebalance low-priority workloads to node-01, which has 40% headroom. This shouldn't cause any downtime."
          isLast
        />
      </ShowcaseCard>

      <ShowcaseCard label="Error">
        <TranscriptStep
          kind="error"
          status="failed"
          title="Failed to evict pod: home-assistant"
          detail="PodDisruptionBudget prevents eviction. minAvailable is set to 1. Need user approval to override."
          isLast
        />
      </ShowcaseCard>
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════
 * LIVE SEQUENCE — a running agent transcript
 * ══════════════════════════════════════════════════════════════════════ */

const LiveSequence = (): React.ReactElement => (
  <div className="bg-bg min-h-screen font-sans text-text antialiased p-8">
    <div className="max-w-xl mx-auto">
      <div className="bg-surface rounded-xl p-4 ring-1 ring-white/5">
        <motion.div {...stagger(0)}>
          <TranscriptStep
            kind="thinking"
            title="Detected memory pressure — checking node allocations"
            duration="0.3s"
            collapsible
          />
        </motion.div>
        <motion.div {...stagger(1)}>
          <TranscriptStep
            kind="tool-call"
            title="kubectl top nodes"
            duration="1.2s"
            output={`NAME      CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%\nnode-01   312m         15%    2841Mi          61%\nnode-02   487m         24%    3892Mi          84%\nnode-03   401m         20%    3744Mi          81%`}
            collapsible
          />
        </motion.div>
        <motion.div {...stagger(2)}>
          <TranscriptStep
            kind="tool-call"
            title="kubectl get pods -o wide --field-selector spec.nodeName=node-02"
            duration="0.8s"
            output={`NAME                          READY   NODE      PRIORITY\nhome-assistant-0              1/1     node-02   high\nprometheus-adapter-6d4c       1/1     node-02   low\nmetrics-server-7b8f            1/1     node-02   low\nnode-exporter-x2k9            1/1     node-02   low`}
            collapsible
          />
        </motion.div>
        <motion.div {...stagger(3)}>
          <TranscriptStep
            kind="thinking"
            title="3 low-priority pods can be rescheduled to node-01"
            detail="prometheus-adapter, metrics-server, and node-exporter. node-01 has sufficient headroom. home-assistant is the largest consumer but has a PodDisruptionBudget."
            collapsible
          />
        </motion.div>
        <motion.div {...stagger(4)}>
          <TranscriptStep
            kind="message"
            title="Rebalancing low-priority workloads to node-01"
          />
        </motion.div>
        <motion.div {...stagger(5)}>
          <TranscriptStep
            kind="tool-call"
            title="kubectl cordon node-02 && kubectl drain node-02 --delete-emptydir-data --ignore-daemonsets --pod-selector=priority=low"
            status="running"
            isLast
          />
        </motion.div>
      </div>
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════
 * COMPLETED — a finished transcript
 * ══════════════════════════════════════════════════════════════════════ */

const Completed = (): React.ReactElement => (
  <div className="bg-bg min-h-screen font-sans text-text antialiased p-8">
    <div className="max-w-xl mx-auto">
      <div className="bg-surface rounded-xl p-4 ring-1 ring-white/5">
        <TranscriptStep
          kind="thinking"
          title="CoreDNS pod in CrashLoopBackOff — checking logs"
          duration="0.2s"
          collapsible
        />
        <TranscriptStep
          kind="tool-call"
          title="kubectl logs coredns-5d78c -n kube-system --tail=20"
          duration="0.6s"
          output={`[ERROR] plugin/forward: no nameservers found\n[FATAL] plugin/forward: not able to start\nE0313 14:02:12.123456 1 main.go:42] Error: "configuration error"`}
          collapsible
        />
        <TranscriptStep
          kind="thinking"
          title="Config issue — checking recent ConfigMap changes"
          duration="0.1s"
          collapsible
        />
        <TranscriptStep
          kind="tool-call"
          title="kubectl rollout history deployment/coredns -n kube-system"
          duration="0.4s"
          output={`REVISION  CHANGE-CAUSE\n1         <none>\n2         configmap update 2026-03-13 13:58`}
          collapsible
        />
        <TranscriptStep
          kind="message"
          title="ConfigMap change caused the crash — rolling back to revision 1"
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
          output={`;; ANSWER SECTION:\nkubernetes.default.svc.cluster.local. 30 IN A 10.96.0.1\n\n;; Query time: 3 msec`}
          collapsible
        />
        <TranscriptStep
          kind="message"
          title="DNS is healthy — resolution confirmed in 3ms"
          detail="Rolled back to the previous stable ConfigMap. The recent change removed the upstream nameserver configuration. Will monitor for 5 minutes."
          isLast
        />
      </div>
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Components/Transcript Step/Variants',
  parameters: {
    layout: 'fullscreen',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
}

type Story = StoryObj

const Kinds: Story = { render: AllKinds }
const Live: Story = { render: LiveSequence }
const Complete: Story = { render: Completed }

export { Kinds, Live, Complete }
export default meta
