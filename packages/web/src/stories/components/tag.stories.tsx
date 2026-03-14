import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tag } from '../../components/tag/tag.tsx';

/*
 * Tag
 *
 * Tags are the service chips, namespace labels, and filter tokens of
 * the interface. They're compact, glanceable, and carry just enough
 * color to communicate state without drawing focus. In the issue
 * pipeline, they often label which part of the infrastructure is
 * affected.
 */

const meta: Meta<typeof Tag> = {
  title: 'Design System/Components/Tag',
  component: Tag,
  parameters: {
    layout: 'padded',
  },
};

type Story = StoryObj<typeof Tag>;

const Variants: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Tags use semantic color to communicate state at a glance. Default is for neutral labels like namespaces. The
        semantic variants mirror the system's issue states.
      </p>
      <div className="flex flex-wrap gap-2">
        <Tag>kube-system</Tag>
        <Tag variant="healthy">Resolved</Tag>
        <Tag variant="warning">Triaged</Tag>
        <Tag variant="info">In Progress</Tag>
        <Tag variant="critical">Needs you</Tag>
      </div>
    </div>
  ),
};

const Removable: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Removable tags are used for active filters. The close icon is subtle until hovered — it shouldn't compete with
        the label.
      </p>
      <div className="flex flex-wrap gap-2">
        <Tag removable>namespace: monitoring</Tag>
        <Tag removable variant="warning">
          stage: triaged
        </Tag>
        <Tag removable variant="info">
          stage: in-progress
        </Tag>
      </div>
    </div>
  ),
};

const InContext: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Tags in practice — labeling the affected infrastructure on an issue card. They're compact enough to sit
        alongside a title without crowding it.
      </p>
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-base font-medium text-text">CoreDNS entered CrashLoopBackOff</h3>
          <span className="text-sm font-mono text-text-muted">14m</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Tag>kube-system</Tag>
          <Tag>coredns-5d78c</Tag>
          <Tag variant="info">In Progress</Tag>
        </div>
        <p className="text-text-secondary text-base leading-relaxed">
          The pod has restarted 3 times in the last 5 minutes. Investigating the root cause.
        </p>
      </div>
    </div>
  ),
};

export { Variants, Removable, InContext };
export default meta;
