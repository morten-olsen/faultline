import type { Meta, StoryObj } from '@storybook/react-vite'

/*
 * Typography
 *
 * Two voices: Geist for the interface (the colleague speaking to you),
 * Geist Mono for machine data (the system beneath). The shift between
 * them is deliberate — it tells you whether you're reading a message
 * or inspecting a value.
 */

type SpecimenProps = {
  size: string
  label: string
  usage: string
  mono?: boolean
  weight?: number
  sampleText: string
  secondary?: boolean
}

const Specimen = ({
  size,
  label,
  usage,
  mono = false,
  weight = 400,
  sampleText,
  secondary = false,
}: SpecimenProps): React.ReactElement => (
  <div style={{ marginBottom: '2.5rem' }}>
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        fontFamily: mono ? '"Geist Mono Variable", monospace' : '"Geist Variable", sans-serif',
        color: secondary ? '#a3a3a3' : '#e8e8e8',
        marginBottom: '0.75rem',
        lineHeight: 1.5,
        letterSpacing: weight >= 500 && !mono ? '-0.02em' : undefined,
      }}
    >
      {sampleText}
    </div>
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '1rem',
      borderTop: '1px solid #1c1c1c',
      paddingTop: '0.625rem',
    }}>
      <span style={{ color: '#5a5a5a', fontSize: '0.6875rem', fontFamily: '"Geist Mono Variable", monospace' }}>
        {label}
      </span>
      <span style={{ color: '#5a5a5a', fontSize: '0.8125rem' }}>
        {usage}
      </span>
    </div>
  </div>
)

const VoiceExample = ({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement => (
  <div style={{
    background: '#141414',
    borderRadius: 12,
    padding: '1.25rem',
    marginBottom: '0.75rem',
  }}>
    <div style={{
      color: '#5a5a5a',
      fontSize: '0.6875rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: '0.75rem',
    }}>
      {label}
    </div>
    {children}
  </div>
)

const TypographyStory = (): React.ReactElement => (
  <div style={{ maxWidth: 640, color: '#e8e8e8' }}>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 500, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
      Typography
    </h2>
    <p style={{ color: '#a3a3a3', fontSize: '0.875rem', lineHeight: 1.8, margin: '0 0 3rem', maxWidth: 520 }}>
      The way Faultline speaks matters as much as what it says.
      The typesetting carries clarity and quiet confidence —
      like a message from someone who has things under control.
    </p>

    {/* ── Two voices ── */}
    <h3 style={{ color: '#e8e8e8', fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.75rem' }}>
      Two voices
    </h3>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.8, margin: '0 0 1.25rem', maxWidth: 520 }}>
      <strong style={{ color: '#e8e8e8' }}>Geist</strong> is the interface voice — clean,
      geometric, built for screens. How the platform speaks to you. Crisp at small sizes,
      expressive at large ones. <strong style={{ color: '#e8e8e8' }}>Geist Mono</strong> is
      the machine voice — for data that comes from the system. Node names, IPs, timestamps.
      The shift to monospace is a signal: "this is a specific thing you can look up."
    </p>

    <VoiceExample label="The platform speaking to you">
      <p style={{ color: '#e8e8e8', fontSize: '0.875rem', lineHeight: 1.8, margin: 0, fontFamily: '"Geist Variable", sans-serif' }}>
        Noticed memory pressure on two nodes — rebalanced a few
        workloads to free up space. Everything else is unaffected.
      </p>
    </VoiceExample>

    <VoiceExample label="The system beneath">
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.8, margin: 0, fontFamily: '"Geist Mono Variable", monospace' }}>
        node-02 mem 84% → evict prometheus-adapter-7f8d2
        <br />
        node-03 mem 81% → evict metrics-server-4c1a
      </p>
    </VoiceExample>

    <div style={{ margin: '3rem 0', borderTop: '1px solid #1c1c1c' }} />

    {/* ── The scale ── */}
    <h3 style={{ color: '#e8e8e8', fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.75rem' }}>
      The scale
    </h3>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.8, margin: '0 0 2.5rem', maxWidth: 520 }}>
      Tighter than a typical dashboard — a 14px base keeps the app feeling modern
      and compact. Each size has a clear purpose. The hierarchy communicates
      through scale, weight, and color together.
    </p>

    <Specimen
      size="2rem"
      label="32px · text-3xl · medium"
      usage="Reserved. The greeting — one per page."
      weight={500}
      sampleText="Everything's running smoothly"
    />
    <Specimen
      size="1.5rem"
      label="24px · text-2xl · medium"
      usage="The status line. Sets the emotional tone of the home page."
      weight={500}
      sampleText="All clear"
    />
    <Specimen
      size="1.25rem"
      label="20px · text-xl · medium"
      usage="Issue detail titles. Grounding — tells you what this issue is."
      weight={500}
      sampleText="Memory pressure on node-02"
    />
    <Specimen
      size="0.875rem"
      label="14px · text-base · regular"
      usage="Body. The conversational voice — most of the interface lives here."
      sampleText="Noticed memory pressure on node-03 — rebalanced a few workloads to free up space."
    />
    <Specimen
      size="0.875rem"
      label="14px · text-base · secondary color"
      usage="Supporting text. Same size, lower emphasis through color."
      sampleText="They'll restart once things settle. Everything else is unaffected."
      secondary
    />
    <Specimen
      size="0.8125rem"
      label="13px · text-sm · regular"
      usage="Row summaries, stage labels, timeline body text."
      sampleText="Moved low-priority workloads. Watching memory settle."
      secondary
    />
    <Specimen
      size="0.6875rem"
      label="11px · text-xs"
      usage="Timestamps, metadata, section labels. Whisper-quiet."
      weight={500}
      sampleText="14m ago · kubernetes · monitoring"
      secondary
    />

    <div style={{ margin: '3rem 0', borderTop: '1px solid #1c1c1c' }} />

    {/* ── Weight ── */}
    <h3 style={{ color: '#e8e8e8', fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.75rem' }}>
      Weight as tone
    </h3>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.8, margin: '0 0 1.5rem', maxWidth: 520 }}>
      Weight carries emotional tone, not just hierarchy. Regular feels conversational.
      Medium adds emphasis. We keep it light — on dark backgrounds, heavy weights
      feel stressed, the opposite of calm. We never go above medium (500).
    </p>

    <div style={{ display: 'flex', gap: '3rem' }}>
      {([
        { weight: 400, label: 'Regular · 400', sample: 'Your trusted companion' },
        { weight: 500, label: 'Medium · 500', sample: 'Your trusted companion' },
      ] as const).map(({ weight, label, sample }) => (
        <div key={weight}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: weight,
            fontFamily: '"Geist Variable", sans-serif',
            color: '#e8e8e8',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}>
            {sample}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#5a5a5a', fontFamily: '"Geist Mono Variable", monospace' }}>{label}</div>
        </div>
      ))}
    </div>

    <div style={{ margin: '3rem 0', borderTop: '1px solid #1c1c1c' }} />

    {/* ── Monospace ── */}
    <h3 style={{ color: '#e8e8e8', fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.75rem' }}>
      Monospace
    </h3>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.8, margin: '0 0 2rem', maxWidth: 520 }}>
      Geist Mono is the machine voice. It surfaces when the interface shows
      something from the system — a node name, an IP, a timestamp, a command.
      The shift to monospace is a subtle signal: "this is a specific thing
      you can look up." It also appears in timestamps throughout the UI to
      give them a distinct visual rhythm.
    </p>

    <Specimen
      size="0.875rem"
      label="14px · mono"
      usage="Node names, pod identifiers, inline data."
      mono
      sampleText="node-03  coredns-5d78c  192.168.1.42"
    />
    <Specimen
      size="0.8125rem"
      label="13px · mono"
      usage="Command blocks in timeline."
      mono
      sampleText="kubectl cordon node-02 && kubectl drain node-02 --pod-selector=priority=low"
    />
    <Specimen
      size="0.6875rem"
      label="11px · mono"
      usage="Timestamps, hashes, compact references."
      mono
      sampleText="a3f8c2d · 14m · 83% mem"
    />
  </div>
)

const meta: Meta = {
  title: 'Design System/Foundations/Typography',
  parameters: {
    layout: 'padded',
  },
}

type Story = StoryObj

const TypeScale: Story = {
  render: TypographyStory,
}

export { TypeScale }
export default meta
