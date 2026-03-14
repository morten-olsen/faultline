import type { Meta, StoryObj } from '@storybook/react-vite';

/*
 * Color Tokens
 *
 * Color in Faultline is never decorative — it encodes meaning.
 * The neutral palette is clean and modern (true grays, not warm stone).
 * Semantic colors are the standard Tailwind shades — universally
 * understood, never ambiguous.
 *
 * When everything is healthy, the interface is mostly neutral.
 * Color appears gently when there's something worth noticing.
 */

type ScaleProps = {
  title: string;
  description: string;
  colors: { name: string; value: string }[];
};

const Scale = ({ title, description, colors }: ScaleProps): React.ReactElement => (
  <div style={{ marginBottom: '2.5rem' }}>
    <h3 style={{ color: '#e8e8e8', fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.5rem' }}>{title}</h3>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', margin: '0 0 1.25rem', maxWidth: 520, lineHeight: 1.6 }}>
      {description}
    </p>
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {colors.map(({ name, value }) => (
        <div key={name} style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 48,
              borderRadius: 8,
              backgroundColor: value,
              border: '1px solid rgba(255,255,255,0.04)',
              marginBottom: '0.375rem',
            }}
          />
          <div style={{ color: '#5a5a5a', fontSize: '0.6875rem', fontFamily: '"Geist Mono Variable", monospace' }}>
            {name.split('-').pop()}
          </div>
        </div>
      ))}
    </div>
  </div>
);

type SemanticPairProps = {
  label: string;
  description: string;
  fg: string;
  bg: string;
};

const SemanticPair = ({ label, description, fg, bg }: SemanticPairProps): React.ReactElement => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.25rem',
      backgroundColor: bg,
      borderRadius: 12,
      borderLeft: `3px solid ${fg}`,
    }}
  >
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: fg,
        flexShrink: 0,
      }}
    />
    <div>
      <div style={{ color: fg, fontSize: '0.875rem', fontWeight: 500 }}>{label}</div>
      <div style={{ color: '#a3a3a3', fontSize: '0.8125rem' }}>{description}</div>
    </div>
  </div>
);

const ColorStory = (): React.ReactElement => (
  <div style={{ maxWidth: 720, color: '#e8e8e8' }}>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 500, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Color</h2>
    <p style={{ color: '#a3a3a3', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 2.5rem', maxWidth: 560 }}>
      The palette is intentionally clean. Dark interfaces can feel cold — ours aims for calm instead, using true
      neutrals that let semantic colors do the talking. Color is reserved for meaning: green is healthy, amber is
      attention, red is genuine failure, blue is "working on it."
    </p>

    <Scale
      title="Neutral"
      description="The foundation. True grays that feel grounded, not clinical. These make up 90% of the interface — backgrounds, borders, text at varying emphasis levels."
      colors={[
        { name: 'neutral-950', value: '#0c0c0c' },
        { name: 'neutral-900', value: '#141414' },
        { name: 'neutral-800', value: '#1c1c1c' },
        { name: 'neutral-700', value: '#282828' },
        { name: 'neutral-600', value: '#3a3a3a' },
        { name: 'neutral-500', value: '#5a5a5a' },
        { name: 'neutral-400', value: '#7e7e7e' },
        { name: 'neutral-300', value: '#a3a3a3' },
        { name: 'neutral-200', value: '#cfcfcf' },
        { name: 'neutral-100', value: '#e8e8e8' },
        { name: 'neutral-50', value: '#f5f5f5' },
      ]}
    />

    <Scale
      title="Green — All is well"
      description="Healthy, resolved, confirmed working. Softer than a traffic light — present enough to reassure, quiet enough to recede when everything's fine."
      colors={[
        { name: 'green-950', value: '#0a1a10' },
        { name: 'green-900', value: '#0f2b1a' },
        { name: 'green-500', value: '#22c55e' },
        { name: 'green-400', value: '#4ade80' },
        { name: 'green-300', value: '#86efac' },
      ]}
    />

    <Scale
      title="Amber — Heads up"
      description="Something to watch. A colleague raising a hand — not an alarm. The system may handle it on its own. The needs-you treatment lives here: warm and inviting, never red."
      colors={[
        { name: 'amber-950', value: '#1a1508' },
        { name: 'amber-900', value: '#2d2410' },
        { name: 'amber-500', value: '#f59e0b' },
        { name: 'amber-400', value: '#fbbf24' },
        { name: 'amber-300', value: '#fcd34d' },
      ]}
    />

    <Scale
      title="Red — Genuine failure"
      description="Reserved for things that are actually broken and degrading. Used sparingly — if everything is red, nothing is. Asking the user to approve a fix is not the same as something failing."
      colors={[
        { name: 'red-950', value: '#1a0a0a' },
        { name: 'red-900', value: '#2d1111' },
        { name: 'red-500', value: '#ef4444' },
        { name: 'red-400', value: '#f87171' },
        { name: 'red-300', value: '#fca5a5' },
      ]}
    />

    <Scale
      title="Blue — Working on it"
      description="The system is acting. Automation in progress, analysis underway. This should feel reassuring — like a capable colleague quietly handling something."
      colors={[
        { name: 'blue-950', value: '#0a1224' },
        { name: 'blue-900', value: '#0f1d3d' },
        { name: 'blue-500', value: '#3b82f6' },
        { name: 'blue-400', value: '#60a5fa' },
        { name: 'blue-300', value: '#93c5fd' },
      ]}
    />

    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{ color: '#e8e8e8', fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.5rem' }}>In context</h3>
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', margin: '0 0 1.25rem', maxWidth: 520, lineHeight: 1.6 }}>
        How colors pair in practice. A foreground signal against a muted background — clear without being loud. These
        are the actual combinations used across the interface.
      </p>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <SemanticPair
          label="All is well"
          description="Everything's running. No action needed."
          fg="#22c55e"
          bg="#0a1a10"
        />
        <SemanticPair
          label="Needs you"
          description="The system is asking — a raised hand, not a siren."
          fg="#f59e0b"
          bg="#1a1508"
        />
        <SemanticPair
          label="Something failed"
          description="Genuinely broken. Reserved for real failures."
          fg="#ef4444"
          bg="#1a0a0a"
        />
        <SemanticPair
          label="Working on it"
          description="Automated remediation in progress."
          fg="#3b82f6"
          bg="#0a1224"
        />
      </div>
    </div>

    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{ color: '#e8e8e8', fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.5rem' }}>Translucency</h3>
      <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', margin: '0 0 1.25rem', maxWidth: 520, lineHeight: 1.6 }}>
        Most surfaces use translucent white rather than solid fills. This creates depth and layering without visual
        weight — surfaces feel like frosted glass, not stacked cards.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {[
          { label: 'white/3', bg: 'rgba(255,255,255,0.03)', desc: 'Cards, containers' },
          { label: 'white/4', bg: 'rgba(255,255,255,0.04)', desc: 'Inputs, chips' },
          { label: 'white/6', bg: 'rgba(255,255,255,0.06)', desc: 'Rings, borders' },
          { label: 'white/8', bg: 'rgba(255,255,255,0.08)', desc: 'Hover states' },
          { label: 'white/12', bg: 'rgba(255,255,255,0.12)', desc: 'Active states' },
        ].map(({ label, bg, desc }) => (
          <div key={label} style={{ textAlign: 'center', flex: 1 }}>
            <div
              style={{
                height: 48,
                borderRadius: 8,
                backgroundColor: bg,
                border: '1px solid rgba(255,255,255,0.04)',
                marginBottom: '0.375rem',
              }}
            />
            <div style={{ color: '#7e7e7e', fontSize: '0.6875rem', fontFamily: '"Geist Mono Variable", monospace' }}>
              {label}
            </div>
            <div style={{ color: '#5a5a5a', fontSize: '0.6875rem', marginTop: 2 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const meta: Meta = {
  title: 'Design System/Foundations/Colors',
  parameters: {
    layout: 'padded',
  },
};

type Story = StoryObj;

const Palette: Story = {
  render: ColorStory,
};

export { Palette };
export default meta;
