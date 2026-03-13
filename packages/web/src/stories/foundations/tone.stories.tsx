import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'motion/react'
import { Hand, CircleCheck, Eye, Wrench, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '../../components/button/button.tsx'

/*
 * Tone — how the system speaks.
 *
 * Faultline is a colleague, not a control panel.
 * This page shows the difference between how we write
 * and how most infrastructure tools write.
 */

/* ── Animation ────────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
}

const stagger = (i: number, base = 0) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay: base + i * 0.06 },
})

/* ── Comparison card ──────────────────────────────────────────────── */

type CompareProps = {
  scenario: string
  wrong: { label: string; text: string; icon?: typeof AlertTriangle; iconColor?: string }
  right: { label: string; text: string; icon?: typeof Hand; iconColor?: string }
  why: string
  index?: number
}

const Compare = ({ scenario, wrong, right, why, index = 0 }: CompareProps): React.ReactElement => {
  const WrongIcon = wrong.icon ?? AlertTriangle
  const RightIcon = right.icon ?? CircleCheck
  return (
    <motion.div {...stagger(index, 0.1)} style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: '0.8125rem', fontWeight: 500, color: '#e8e8e8',
        marginBottom: 10,
      }}>
        {scenario}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div style={{
          background: 'rgba(239,68,68,0.03)', borderRadius: 10,
          border: '1px solid rgba(239,68,68,0.08)', padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <WrongIcon size={12} style={{ color: wrong.iconColor ?? '#f87171', opacity: 0.6 }} />
            <span style={{ fontSize: '0.6875rem', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{wrong.label}</span>
          </div>
          <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>{wrong.text}</p>
        </div>
        <div style={{
          background: 'rgba(34,197,94,0.03)', borderRadius: 10,
          border: '1px solid rgba(34,197,94,0.08)', padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <RightIcon size={12} style={{ color: right.iconColor ?? '#4ade80', opacity: 0.6 }} />
            <span style={{ fontSize: '0.6875rem', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{right.label}</span>
          </div>
          <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>{right.text}</p>
        </div>
      </div>
      <p style={{ color: '#5a5a5a', fontSize: '0.75rem', lineHeight: 1.5, margin: 0 }}>{why}</p>
    </motion.div>
  )
}

/* ── Voice demo ───────────────────────────────────────────────────── */

type VoiceDemoProps = {
  label: string
  children: React.ReactNode
  index?: number
}

const VoiceDemo = ({ label, children, index = 0 }: VoiceDemoProps): React.ReactElement => (
  <motion.div {...stagger(index, 0.15)} style={{
    background: '#141414', borderRadius: 12, padding: '14px 16px', marginBottom: 10,
  }}>
    <div style={{
      color: '#5a5a5a', fontSize: '0.6rem', fontWeight: 500,
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
    }}>
      {label}
    </div>
    {children}
  </motion.div>
)

/* ── Main story ───────────────────────────────────────────────────── */

const ToneStory = (): React.ReactElement => (
  <div style={{ maxWidth: 640, margin: '0 auto', color: '#e8e8e8' }}>
    <motion.div {...fadeUp}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: 6 }}>Tone</h1>
      <p style={{ color: '#a3a3a3', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 8, maxWidth: 520 }}>
        Faultline is a colleague, not a control panel. The way it communicates is as important
        as what it communicates. Every message should feel like it came from a calm, capable
        person — not a log parser or a monitoring dashboard.
      </p>
      <p style={{ color: '#5a5a5a', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: 40 }}>
        The same event can be described in a way that creates anxiety or in a way that
        creates confidence. We always choose confidence.
      </p>
    </motion.div>

    {/* ── Status messages ── */}
    <motion.div {...stagger(0, 0.05)}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: 16 }}>Status messages</h3>
    </motion.div>

    <Compare
      index={0}
      scenario="Everything is healthy"
      wrong={{ label: 'Typical', text: 'No active alerts. 0 warnings. 0 critical.', icon: XCircle, iconColor: '#5a5a5a' }}
      right={{ label: 'Faultline', text: 'All clear. 5 issues handled today, all automatic.' }}
      why="Don't describe absence. Describe the feeling. The user wants to know they're good, not count zeros."
    />

    <Compare
      index={1}
      scenario="System is working on something"
      wrong={{ label: 'Typical', text: 'WARNING: Memory utilization on node-02 exceeded threshold (84% > 80%). Auto-remediation initiated.' }}
      right={{ label: 'Faultline', text: 'Memory pressure on node-02 — moved a few workloads to free up space. Watching it settle.' }}
      why="Plain language, present tense, active voice. The user should feel like someone is handling it, not reading a log line."
    />

    <Compare
      index={2}
      scenario="System needs human input"
      wrong={{ label: 'Typical', text: 'ACTION REQUIRED: Memory remediation failed. Manual intervention needed. Click here to review.' }}
      right={{ label: 'Faultline', text: 'Approve evicting home-assistant? Your smart home would be offline for about 3 minutes, then resume automatically.', icon: Hand, iconColor: '#fbbf24' }}
      why="A question, not a command. Explain the impact in terms the user cares about (smart home offline), not in system terms (pod eviction)."
    />

    <Compare
      index={3}
      scenario="A fix didn't work"
      wrong={{ label: 'Typical', text: 'ALERT: Previous remediation ineffective. Memory utilization has re-exceeded threshold. Escalating.' }}
      right={{ label: 'Faultline', text: 'Memory climbed back above 80%. The first approach didn\'t hold — trying something different.' }}
      why="Honesty without alarm. The system tried, it didn't work, it's trying again. That's normal. Don't make the user think the sky is falling."
    />

    <Compare
      index={4}
      scenario="Issue resolved"
      wrong={{ label: 'Typical', text: 'RESOLVED: Alert cleared. Memory utilization returned to nominal levels. Alert duration: 50m.' }}
      right={{ label: 'Faultline', text: 'Resolved. Took 50 minutes from detection to close.' }}
      why="Quiet and factual. No celebration, no fanfare. The system handled it. That's the whole point."
    />

    <div style={{ margin: '40px 0', borderTop: '1px solid #1c1c1c' }} />

    {/* ── The two voices ── */}
    <motion.div {...stagger(0, 0.1)}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: 6 }}>The two typographic voices</h3>
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, marginBottom: 16, maxWidth: 480 }}>
        When the system talks to you, it uses Geist — warm, proportional, conversational.
        When it shows you data from the infrastructure, it shifts to Geist Mono. This isn't
        just styling — it's a signal. Proportional means "I'm talking to you." Mono means
        "this is a specific thing you can look up."
      </p>
    </motion.div>

    <VoiceDemo label="The colleague" index={0}>
      <p style={{ color: '#e8e8e8', fontSize: '0.8125rem', lineHeight: 1.7, margin: 0, fontFamily: '"Geist Variable", sans-serif' }}>
        Memory has been above 80% for over an hour despite two rebalancing attempts.
        The most effective option is to evict home-assistant temporarily — your smart
        home would be offline for about 3 minutes, then resume automatically.
      </p>
    </VoiceDemo>

    <VoiceDemo label="The system beneath" index={1}>
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.7, margin: 0, fontFamily: '"Geist Mono Variable", monospace' }}>
        kubectl cordon node-02 && kubectl drain node-02
        <br />
        {'  '}--delete-emptydir-data --ignore-daemonsets
        <br />
        {'  '}--pod-selector=priority=low
      </p>
    </VoiceDemo>

    <VoiceDemo label="Both together" index={2}>
      <p style={{ color: '#e8e8e8', fontSize: '0.8125rem', lineHeight: 1.7, margin: '0 0 8px', fontFamily: '"Geist Variable", sans-serif' }}>
        Moved low-priority workloads to node-01. Memory on{' '}
        <span style={{ fontFamily: '"Geist Mono Variable", monospace', color: '#a3a3a3' }}>node-02</span>{' '}
        dropped from{' '}
        <span style={{ fontFamily: '"Geist Mono Variable", monospace', color: '#a3a3a3' }}>84%</span>{' '}
        to{' '}
        <span style={{ fontFamily: '"Geist Mono Variable", monospace', color: '#a3a3a3' }}>68%</span>.
      </p>
    </VoiceDemo>

    <div style={{ margin: '40px 0', borderTop: '1px solid #1c1c1c' }} />

    {/* ── Writing rules ── */}
    <motion.div {...stagger(0, 0.1)}>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: 16 }}>Writing rules</h3>
    </motion.div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { rule: 'Plain language over jargon.', example: '"Memory pressure" not "memory utilization threshold exceeded."' },
        { rule: 'Active voice over passive.', example: '"Restarted the pod" not "the pod was restarted."' },
        { rule: 'Describe impact, not metrics.', example: '"Your smart home would be offline for 3 minutes" not "pod eviction with 30s grace period."' },
        { rule: 'Questions over commands.', example: '"Approve evicting home-assistant?" not "ACTION REQUIRED: evict home-assistant."' },
        { rule: 'Honesty over optimism.', example: '"The first approach didn\'t hold" not "remediation partially successful."' },
        { rule: 'Quiet over loud.', example: '"Resolved" not "SUCCESS: Alert cleared!"' },
        { rule: 'Present tense over past.', example: '"Watching memory settle" not "memory was observed to decrease."' },
        { rule: 'No ALL CAPS ever.', example: 'Not WARNING, not ERROR, not CRITICAL, not ACTION REQUIRED.' },
      ].map(({ rule, example }, i) => (
        <motion.div key={rule} {...stagger(i, 0.2)} style={{
          padding: '10px 14px', background: '#141414', borderRadius: 10,
        }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{rule}</span>
          <span style={{ fontSize: '0.75rem', color: '#5a5a5a', display: 'block', marginTop: 2 }}>{example}</span>
        </motion.div>
      ))}
    </div>
  </div>
)

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Foundations/Tone',
  parameters: {
    layout: 'padded',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
}

type Story = StoryObj

const VoiceAndTone: Story = { render: ToneStory }

export { VoiceAndTone }
export default meta
