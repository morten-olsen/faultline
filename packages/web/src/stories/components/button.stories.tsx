import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check, ChevronRight, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';

import { Button } from '../../components/button/button.tsx';

/*
 * Button
 *
 * Buttons in Faultline are rare. Most of the time, the system acts on its own
 * and the user just watches. When a button does appear, it means the user has
 * chosen to step in — approve a fix, dismiss an issue, or take manual control.
 * They should feel deliberate and trustworthy, never flashy.
 */

const meta: Meta<typeof Button> = {
  title: 'Design System/Components/Button',
  component: Button,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

type Story = StoryObj<typeof Button>;

const Variants: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Four variants, each with a clear purpose. Primary is reserved for the single most important action — approve,
        confirm, proceed. Secondary is the default. Ghost is for actions that should be available but not prominent.
        Danger is for things you can't easily undo.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary">Approve fix</Button>
        <Button variant="secondary">View details</Button>
        <Button variant="ghost">Dismiss</Button>
        <Button variant="danger">Force restart</Button>
      </div>
    </div>
  ),
};

const Sizes: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Small for tight spaces like table rows or inline actions. Medium is the default. Large for standalone or hero
        actions — like the approve button on a "Needs you" card.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    </div>
  ),
};

const WithIcons: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Icons from Lucide add clarity without adding weight. Left icons reinforce the action; right icons (usually
        chevrons) suggest navigation.
      </p>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" icon={Check}>
            Approve
          </Button>
          <Button variant="secondary" icon={RotateCcw}>
            Retry
          </Button>
          <Button variant="ghost" icon={Play}>
            Resume
          </Button>
          <Button variant="danger" icon={Trash2}>
            Delete
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" iconRight={ChevronRight}>
            View details
          </Button>
          <Button variant="ghost" icon={Pause}>
            Pause automation
          </Button>
        </div>
      </div>
    </div>
  ),
};

const States: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Disabled buttons fade gently — they're still visible but clearly unavailable. The loading state replaces the
        icon with a spinner, keeping the button width stable so the layout doesn't shift.
      </p>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Active</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" loading>
            Approving...
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary">Active</Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="secondary" loading>
            Loading...
          </Button>
        </div>
      </div>
    </div>
  ),
};

const InContext: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        How buttons appear in practice. The "Needs you" card has a clear primary action. The resolved item has quiet
        ghost actions. The prominence matches the urgency.
      </p>

      {/* Needs-you card example */}
      <div className="bg-critical-muted rounded-xl border border-red-900 p-5 mb-4">
        <h3 className="text-base font-medium text-text mb-2">NAS disk showing SMART warnings</h3>
        <p className="text-text-secondary text-base leading-relaxed mb-4">
          Disk 3 needs a physical swap. The array is degraded but online.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="primary" icon={Check} size="lg">
            Acknowledge
          </Button>
          <Button variant="ghost" iconRight={ChevronRight}>
            View SMART data
          </Button>
        </div>
      </div>

      {/* Resolved item example */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-text">CoreDNS CrashLoopBackOff</h3>
            <p className="text-text-muted text-sm mt-0.5">Resolved automatically · 14m ago</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Dismiss
            </Button>
            <Button variant="ghost" size="sm" iconRight={ChevronRight}>
              Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  ),
};

export { Variants, Sizes, WithIcons, States, InContext };
export default meta;
