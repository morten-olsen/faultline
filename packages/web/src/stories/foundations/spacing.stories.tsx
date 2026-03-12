import type { Meta, StoryObj } from '@storybook/react-vite'

/*
 * Spacing, Radius & Layout
 *
 * Generous spacing is a feature, not wasted space. The calm comes
 * from the room you give things — a checkmark centered on a wide
 * page feels peaceful; the same checkmark crammed between stats
 * feels like another data point.
 */

type SpacingRowProps = {
  name: string
  rem: string
  px: string
  usage: string
}

const SpacingRow = ({ name, rem, px, usage }: SpacingRowProps): React.ReactElement => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
    <div
      style={{
        width: rem,
        height: 16,
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        flexShrink: 0,
        minWidth: 2,
        opacity: 0.4,
      }}
    />
    <div style={{ minWidth: 56 }}>
      <span style={{ color: '#e8e8e8', fontSize: '0.8125rem', fontFamily: '"Geist Mono Variable", monospace' }}>{name}</span>
    </div>
    <span style={{ color: '#5a5a5a', fontSize: '0.75rem', fontFamily: '"Geist Mono Variable", monospace', minWidth: 40 }}>
      {px}
    </span>
    <span style={{ color: '#5a5a5a', fontSize: '0.8125rem' }}>{usage}</span>
  </div>
)

type RadiusBoxProps = {
  name: string
  value: string
  px: string
  usage: string
}

const RadiusBox = ({ name, value, px, usage }: RadiusBoxProps): React.ReactElement => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        width: 80,
        height: 80,
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: value,
        margin: '0 auto 0.75rem',
      }}
    />
    <div style={{ color: '#e8e8e8', fontSize: '0.8125rem', fontWeight: 500 }}>{name}</div>
    <div style={{ color: '#5a5a5a', fontSize: '0.6875rem', fontFamily: '"Geist Mono Variable", monospace' }}>{px}</div>
    <div style={{ color: '#5a5a5a', fontSize: '0.6875rem', marginTop: '0.25rem' }}>{usage}</div>
  </div>
)

const SpacingStory = (): React.ReactElement => (
  <div style={{ maxWidth: 720, color: '#e8e8e8' }}>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 500, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Spacing</h2>
    <p style={{ color: '#a3a3a3', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 2.5rem', maxWidth: 560 }}>
      Generous spacing is how the interface breathes. The calm comes from the room
      you give things — a checkmark centered on a wide page feels peaceful; the same
      checkmark crammed between stats feels like another data point. Default to spacious.
    </p>

    <SpacingRow name="0.5" rem="0.125rem" px="2px" usage="Hairline gaps" />
    <SpacingRow name="1" rem="0.25rem" px="4px" usage="Tight padding" />
    <SpacingRow name="1.5" rem="0.375rem" px="6px" usage="Badge padding, inline gaps" />
    <SpacingRow name="2" rem="0.5rem" px="8px" usage="Chip gaps, compact padding" />
    <SpacingRow name="3" rem="0.75rem" px="12px" usage="Icon gaps, row padding" />
    <SpacingRow name="4" rem="1rem" px="16px" usage="Card padding, standard gap" />
    <SpacingRow name="5" rem="1.25rem" px="20px" usage="Card inner padding (px-5)" />
    <SpacingRow name="6" rem="1.5rem" px="24px" usage="Section padding" />
    <SpacingRow name="8" rem="2rem" px="32px" usage="Section gaps, mt-8" />
    <SpacingRow name="10" rem="2.5rem" px="40px" usage="Page vertical rhythm" />
    <SpacingRow name="12" rem="3rem" px="48px" usage="Page bottom padding (pb-12)" />

    <div style={{ margin: '2.5rem 0', borderTop: '1px solid #1c1c1c' }} />

    <h3 style={{ color: '#e8e8e8', fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.5rem' }}>
      Border Radius
    </h3>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.7, margin: '0 0 1.5rem', maxWidth: 520 }}>
      Consistently rounded — modern but not bubbly. Buttons and inputs
      use `rounded-lg` (12px). Cards and containers use `rounded-xl` (16px).
      Badges and pills use `rounded-full`.
    </p>

    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'flex-start' }}>
      <RadiusBox name="sm" value="0.375rem" px="6px" usage="Tags" />
      <RadiusBox name="md" value="0.5rem" px="8px" usage="Small chips" />
      <RadiusBox name="lg" value="0.75rem" px="12px" usage="Buttons, inputs" />
      <RadiusBox name="xl" value="1rem" px="16px" usage="Cards, panels" />
      <RadiusBox name="full" value="999px" px="∞" usage="Badges, pills" />
    </div>

    <div style={{ margin: '2.5rem 0', borderTop: '1px solid #1c1c1c' }} />

    <h3 style={{ color: '#e8e8e8', fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.5rem' }}>
      The narrow column
    </h3>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.7, margin: '0 0 1.5rem', maxWidth: 520 }}>
      Every page uses <code style={{ color: '#60a5fa', fontSize: '0.75rem' }}>max-w-lg</code> (512px).
      On desktop it doesn't fill the screen, and that's the point. A wide layout invites complexity.
      A narrow layout forces simplicity. It also means the mobile experience is identical —
      no responsive breakpoints, no degraded version.
    </p>

    <div style={{ position: 'relative', margin: '1.5rem 0', padding: '1rem 0' }}>
      <div style={{
        maxWidth: 512, margin: '0 auto', height: 120,
        background: 'rgba(255,255,255,0.03)', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: '#5a5a5a', fontSize: '0.75rem', fontFamily: '"Geist Mono Variable", monospace' }}>max-w-lg · 512px</span>
      </div>
    </div>
  </div>
)

const meta: Meta = {
  title: 'Design System/Foundations/Spacing',
  parameters: {
    layout: 'padded',
  },
}

type Story = StoryObj

const Scale: Story = {
  render: SpacingStory,
}

export { Scale }
export default meta
