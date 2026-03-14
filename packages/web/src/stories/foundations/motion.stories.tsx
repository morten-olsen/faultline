import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CircleCheck, Eye, Hand, Search, RotateCcw } from 'lucide-react';

/*
 * Motion — Principle 7: Motion as Storytelling
 *
 * Things don't just appear — they enter. And when they leave, they exit.
 * Motion is not decoration; it is narrative. It establishes hierarchy,
 * signals relationships, and creates continuity between states.
 */

/* ── Shared ───────────────────────────────────────────────────────── */

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const SectionLabel = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div
    style={{
      color: '#5a5a5a',
      fontSize: '0.6875rem',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginBottom: 12,
      marginTop: 48,
    }}
  >
    {children}
  </div>
);

const ReplayButton = ({ onReplay }: { onReplay: () => void }): React.ReactElement => (
  <button
    type="button"
    onClick={onReplay}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.06)',
      border: 'none',
      color: '#a3a3a3',
      fontSize: '0.75rem',
      cursor: 'pointer',
    }}
  >
    <RotateCcw size={12} /> Replay
  </button>
);

/* ── Easing visualization ─────────────────────────────────────────── */

const EasingDemo = (): React.ReactElement => {
  const [key, setKey] = useState(0);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 16 }}>
        <ReplayButton onReplay={() => setKey((k) => k + 1)} />
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        {(
          [
            { label: 'easeOut', ease: [0.25, 0.1, 0.25, 1], desc: 'Entrances — fast start, gentle landing' },
            { label: 'easeInOut', ease: [0.4, 0, 0.2, 1], desc: 'Layout shifts — smooth both ways' },
            { label: 'linear', ease: [0, 0, 1, 1], desc: 'Never used — feels mechanical' },
          ] as const
        ).map(({ label, ease, desc }) => (
          <div key={`${label}-${key}`} style={{ flex: 1 }}>
            <div
              style={{
                height: 80,
                borderRadius: 10,
                background: '#141414',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: 8,
              }}
            >
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.2, ease }}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: label === 'linear' ? '#5a5a5a' : '#60a5fa',
                  position: 'absolute',
                  top: 32,
                  left: 8,
                }}
              />
            </div>
            <div style={{ color: '#e8e8e8', fontSize: '0.75rem', fontFamily: '"Geist Mono Variable", monospace' }}>
              {label}
            </div>
            <div style={{ color: '#5a5a5a', fontSize: '0.6875rem', marginTop: 2 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Timing ───────────────────────────────────────────────────────── */

const TimingDemo = (): React.ReactElement => {
  const [key, setKey] = useState(0);
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <ReplayButton onReplay={() => setKey((k) => k + 1)} />
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        {(
          [
            { label: '120ms', duration: 0.12, usage: 'Hover, focus rings', color: '#4ade80' },
            { label: '200ms', duration: 0.2, usage: 'Micro-interactions', color: '#60a5fa' },
            { label: '350ms', duration: 0.35, usage: 'Element entrances', color: '#fbbf24' },
            { label: '400ms', duration: 0.4, usage: 'Card reveals, layout', color: '#f87171' },
          ] as const
        ).map(({ label, duration, usage, color }) => (
          <div key={`${label}-${key}`} style={{ flex: 1 }}>
            <div
              style={{
                height: 80,
                borderRadius: 10,
                background: '#141414',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration, ease: easeOut }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: color,
                  opacity: 0.7,
                }}
              />
            </div>
            <div
              style={{
                color: '#e8e8e8',
                fontSize: '0.75rem',
                fontFamily: '"Geist Mono Variable", monospace',
                marginTop: 8,
              }}
            >
              {label}
            </div>
            <div style={{ color: '#5a5a5a', fontSize: '0.6875rem', marginTop: 2 }}>{usage}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Stagger demo ─────────────────────────────────────────────────── */

const StaggerDemo = (): React.ReactElement => {
  const [key, setKey] = useState(0);
  const rows = [
    { icon: Hand, color: '#fbbf24', title: 'NAS disk showing SMART warnings', tag: 'Needs you' },
    { icon: Eye, color: '#4ade80', title: 'Memory pressure on node-02', tag: 'Monitoring' },
    { icon: Search, color: '#fbbf24', title: 'Elevated API latency on traefik', tag: 'Triage' },
    { icon: CircleCheck, color: '#22c55e', title: 'CoreDNS CrashLoopBackOff', tag: 'Resolved' },
  ];
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <ReplayButton onReplay={() => setKey((k) => k + 1)} />
      </div>
      <div style={{ background: '#141414', borderRadius: 12, padding: 16, maxWidth: 420 }}>
        {rows.map(({ icon, color, title, tag }, i) => {
          const IconComponent = icon;
          return (
            <motion.div
              key={`${title}-${key}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easeOut, delay: i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 0',
                borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <IconComponent size={14} style={{ color, opacity: 0.8 }} />
              <span style={{ fontSize: '0.8125rem', color: '#e8e8e8', flex: 1 }}>{title}</span>
              <span style={{ fontSize: '0.6875rem', color: '#5a5a5a' }}>{tag}</span>
            </motion.div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
        <div>
          <span style={{ color: '#e8e8e8', fontSize: '0.75rem', fontFamily: '"Geist Mono Variable", monospace' }}>
            50ms
          </span>
          <span style={{ color: '#5a5a5a', fontSize: '0.6875rem', marginLeft: 6 }}>stagger delay between rows</span>
        </div>
        <div>
          <span style={{ color: '#e8e8e8', fontSize: '0.75rem', fontFamily: '"Geist Mono Variable", monospace' }}>
            8px
          </span>
          <span style={{ color: '#5a5a5a', fontSize: '0.6875rem', marginLeft: 6 }}>vertical travel distance</span>
        </div>
      </div>
    </div>
  );
};

/* ── Enter / Exit demo ────────────────────────────────────────────── */

const EnterExitDemo = (): React.ReactElement => {
  const [visible, setVisible] = useState(true);
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            background: visible ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            border: 'none',
            color: visible ? '#f87171' : '#4ade80',
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}
        >
          {visible ? 'Dismiss' : 'Show'}
        </button>
      </div>
      <div style={{ height: 100, display: 'flex', alignItems: 'center' }}>
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: easeOut }}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(245,158,11,0.12)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                maxWidth: 380,
              }}
            >
              <Hand size={14} style={{ color: '#fbbf24', opacity: 0.8 }} />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#e8e8e8' }}>
                  Approve evicting home-assistant?
                </div>
                <div style={{ fontSize: '0.75rem', color: '#5a5a5a', marginTop: 2 }}>
                  Smart home offline for ~3 minutes.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div style={{ marginTop: 8, color: '#5a5a5a', fontSize: '0.6875rem' }}>
        Enter: fade + slide up (10px) · Exit: fade + slide up (8px) — exits are slightly faster and shorter than
        entrances.
      </div>
    </div>
  );
};

/* ── Hierarchy demo ───────────────────────────────────────────────── */

const HierarchyDemo = (): React.ReactElement => {
  const [key, setKey] = useState(0);
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <ReplayButton onReplay={() => setKey((k) => k + 1)} />
      </div>
      <div style={{ background: '#141414', borderRadius: 12, padding: '20px 20px 16px', maxWidth: 380 }}>
        {/* Status line — arrives first */}
        <motion.div
          key={`heading-${key}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 500, letterSpacing: '-0.02em' }}>1 thing needs you</span>
        </motion.div>

        {/* Subtitle — slight delay */}
        <motion.div
          key={`sub-${key}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut, delay: 0.08 }}
          style={{ fontSize: '0.8125rem', color: '#5a5a5a', marginBottom: 16 }}
        >
          2 more being handled.
        </motion.div>

        {/* Needs-you card — enters with presence */}
        <motion.div
          key={`card-${key}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: easeOut, delay: 0.15 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(245,158,11,0.12)',
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hand size={13} style={{ color: '#fbbf24', opacity: 0.8 }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>NAS disk SMART warnings</span>
          </div>
        </motion.div>

        {/* Section label */}
        <motion.div
          key={`label-${key}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          style={{
            color: '#5a5a5a',
            fontSize: '0.6rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginTop: 16,
            marginBottom: 6,
          }}
        >
          Ongoing
        </motion.div>

        {/* Rows — stagger in */}
        {[
          { icon: Eye, color: '#4ade80', title: 'Memory pressure on node-02' },
          { icon: Search, color: '#fbbf24', title: 'API latency on traefik' },
        ].map(({ icon, color, title }, i) => {
          const IconComponent = icon;
          return (
            <motion.div
              key={`${title}-${key}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easeOut, delay: 0.4 + i * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <IconComponent size={13} style={{ color, opacity: 0.7 }} />
              <span style={{ fontSize: '0.8125rem', color: '#a3a3a3' }}>{title}</span>
            </motion.div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, color: '#5a5a5a', fontSize: '0.6875rem', maxWidth: 380, lineHeight: 1.6 }}>
        The status line arrives first (0ms), subtitle follows (80ms), the needs-you card settles in (150ms), then
        section label (350ms) and rows stagger (400ms+). The user's eye follows the hierarchy naturally.
      </div>
    </div>
  );
};

/* ── Main story ───────────────────────────────────────────────────── */

const MotionStory = (): React.ReactElement => (
  <div style={{ maxWidth: 720, color: '#e8e8e8' }}>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 500, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Motion</h2>
    <p style={{ color: '#a3a3a3', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 1rem', maxWidth: 560 }}>
      Things don't just appear — they enter. And when they leave, they exit. Motion is not decoration; it is narrative.
      A card that fades up from below
      <em> arrives</em>. A row that staggers in after its siblings tells the user "there's a sequence here."
    </p>
    <p style={{ color: '#5a5a5a', fontSize: '0.8125rem', lineHeight: 1.7, margin: '0 0 2rem', maxWidth: 560 }}>
      We use{' '}
      <a href="https://motion.dev" style={{ color: '#60a5fa', textDecoration: 'none' }}>
        Motion
      </a>{' '}
      (framer-motion) for orchestrated animations. CSS transitions handle hover and focus states.
    </p>

    <SectionLabel>Easing</SectionLabel>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 520 }}>
      We use one easing curve for almost everything: a custom{' '}
      <code style={{ color: '#60a5fa', fontSize: '0.6875rem' }}>easeOut</code> that starts fast and lands gently.
      Content arrives with momentum and settles into place.
    </p>
    <EasingDemo />

    <SectionLabel>Timing</SectionLabel>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 520 }}>
      Fast enough to feel responsive, slow enough to be perceived. The range is 120ms–400ms. Nothing slower — the
      interface should feel like content settling, not a slideshow.
    </p>
    <TimingDemo />

    <SectionLabel>Stagger</SectionLabel>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 520 }}>
      When multiple elements appear, cascade them with short delays (30–50ms between siblings). The user's eye follows
      the rhythm and absorbs the hierarchy without conscious effort. The stagger reveals structure — it says "these are
      related, and they have an order."
    </p>
    <StaggerDemo />

    <SectionLabel>Enter & Exit</SectionLabel>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 520 }}>
      Every element that appears should have a moment — a subtle fade and short slide. Removed elements exit with the
      same care. The user should feel continuity, not disruption. Exits are slightly faster and travel less distance
      than entrances.
    </p>
    <EnterExitDemo />

    <SectionLabel>Hierarchy through timing</SectionLabel>
    <p style={{ color: '#a3a3a3', fontSize: '0.8125rem', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 520 }}>
      Animation delay establishes what matters most. The status line arrives first because that's the first question
      ("am I good?"). The needs-you card enters second because that's the next question ("do I need to do anything?").
      Everything else follows. The motion
      <em> is</em> the information hierarchy.
    </p>
    <HierarchyDemo />

    <div style={{ margin: '3rem 0', borderTop: '1px solid #1c1c1c' }} />

    <h3 style={{ color: '#e8e8e8', fontSize: '1.125rem', fontWeight: 500, margin: '0 0 0.75rem' }}>The rules</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {[
        {
          rule: "Enter, don't snap.",
          desc: 'Every element gets a moment — subtle fade, short slide. Enough to feel intentional, not enough to slow the user down.',
        },
        {
          rule: 'Stagger to show structure.',
          desc: 'Cascade siblings with 30–50ms delays. The eye follows the rhythm and absorbs the hierarchy.',
        },
        {
          rule: 'Keep it quiet.',
          desc: '200–400ms duration. Gentle easeOut. 8–12px travel. Nothing bounces, nothing overshoots, nothing calls attention to itself.',
        },
        {
          rule: 'Exit with care.',
          desc: 'Removed elements fade and slide away. Slightly faster than entrance. The user feels continuity, not jump cuts.',
        },
        {
          rule: 'Hierarchy through delay.',
          desc: 'The most important thing arrives first. Animation order mirrors the information hierarchy.',
        },
      ].map(({ rule, desc }) => (
        <div key={rule} style={{ padding: '10px 14px', background: '#141414', borderRadius: 10 }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{rule}</span>
          <span style={{ fontSize: '0.8125rem', color: '#5a5a5a' }}> {desc}</span>
        </div>
      ))}
    </div>
  </div>
);

const meta: Meta = {
  title: 'Design System/Foundations/Motion',
  parameters: {
    layout: 'padded',
  },
};

type Story = StoryObj;

const Principles: Story = {
  render: MotionStory,
};

export { Principles };
export default meta;
