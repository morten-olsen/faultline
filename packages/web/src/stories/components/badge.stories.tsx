import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

import { Badge } from '../../components/badge/badge.tsx';

/*
 * Badge
 *
 * Badges are the smallest semantic indicators — uppercase, compact, color-coded.
 * They label status at the highest level: on the home page header, on issue
 * counts, on system-wide state. A badge should be readable at arm's length.
 */

const meta: Meta<typeof Badge> = {
  title: 'Design System/Components/Badge',
  component: Badge,
  parameters: {
    layout: 'padded',
  },
};

type Story = StoryObj<typeof Badge>;

const Variants: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Five variants matching the system's semantic palette. Default is for neutral metadata. The semantic variants
        communicate issue state instantly.
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="healthy">All Clear</Badge>
        <Badge variant="warning">1 Warning</Badge>
        <Badge variant="critical">Needs You</Badge>
        <Badge variant="info">3 In Progress</Badge>
      </div>
    </div>
  ),
};

const WithIcons: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        An optional Lucide icon reinforces the meaning. Use sparingly — the color already carries most of the signal.
        Icons help when badges appear in isolation without surrounding context.
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="healthy" icon={CheckCircle}>
          Resolved
        </Badge>
        <Badge variant="warning" icon={Clock}>
          Triaged
        </Badge>
        <Badge variant="info" icon={Activity}>
          In Progress
        </Badge>
        <Badge variant="critical" icon={AlertCircle}>
          Needs You
        </Badge>
        <Badge variant="info" icon={Zap}>
          Automated
        </Badge>
      </div>
    </div>
  ),
};

const InContext: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Badges in the page header — the first thing the user sees. A single badge communicates the overall system state.
      </p>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-text tracking-tight">Home</h2>
          <Badge variant="healthy" icon={CheckCircle}>
            All Clear
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-text tracking-tight">Home</h2>
          <Badge variant="info">2 In Progress</Badge>
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-text tracking-tight">Home</h2>
          <Badge variant="critical" icon={AlertCircle}>
            1 Needs You
          </Badge>
        </div>
      </div>
    </div>
  ),
};

export { Variants, WithIcons, InContext };
export default meta;
