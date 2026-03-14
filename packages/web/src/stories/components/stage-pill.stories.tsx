import type { Meta, StoryObj } from '@storybook/react-vite';

import { StagePill } from '../../components/stage-pill/stage-pill.tsx';

/*
 * Stage Pill
 *
 * The stage pill is the pipeline indicator on every issue card. It shows
 * where in the lifecycle an issue sits and optionally flags that the
 * user is needed.
 *
 * Each stage has a Lucide icon and a semantic color:
 *   Triage (Search, amber) → Investigation (Lightbulb, blue) →
 *   Proposed Plan (ListChecks, blue) → Implementation (Wrench, blue) →
 *   Monitoring (Eye, green) → Resolved (CircleCheck, green)
 *
 * The "Needs you" flag is layered alongside any stage — it's not a
 * separate state, but a signal that the pipeline is blocked on a human.
 */

const meta: Meta<typeof StagePill> = {
  title: 'Design System/Components/Stage Pill',
  component: StagePill,
  parameters: {
    layout: 'padded',
  },
};

type Story = StoryObj<typeof StagePill>;

const Pipeline: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        The six stages of the issue lifecycle. Color shifts from warm (triage) to cool (investigation, plan,
        implementation) to calm (monitoring, resolved) — mirroring the emotional arc from "we've noticed" to "it's
        handled."
      </p>
      <div className="flex flex-col gap-4">
        <StagePill stage="triage" />
        <StagePill stage="investigation" />
        <StagePill stage="proposed-plan" />
        <StagePill stage="implementation" />
        <StagePill stage="monitoring" />
        <StagePill stage="resolved" />
      </div>
    </div>
  ),
};

const WithNeedsYou: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        "Needs you" can appear at any stage. It means the pipeline is blocked until the user acts — maybe input during
        investigation, approval for a proposed plan, or confirmation during monitoring.
      </p>
      <div className="flex flex-col gap-4">
        <StagePill stage="triage" needsYou />
        <StagePill stage="investigation" needsYou />
        <StagePill stage="proposed-plan" needsYou />
        <StagePill stage="implementation" needsYou />
        <StagePill stage="monitoring" needsYou />
      </div>
    </div>
  ),
};

const InContext: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Stage pills on issue cards — showing pipeline position at a glance.
      </p>
      <div className="flex flex-col gap-3">
        <div className="bg-white/3 rounded-xl ring-1 ring-amber-500/12 p-5">
          <h3 className="text-base font-medium text-text mb-2">NAS disk SMART warnings</h3>
          <p className="text-text-secondary text-base leading-relaxed mb-4">Disk 3 needs a physical swap.</p>
          <StagePill stage="proposed-plan" needsYou />
        </div>
        <div className="bg-white/3 rounded-xl ring-1 ring-white/6 p-5">
          <h3 className="text-base font-medium text-text mb-2">Memory pressure on node-02</h3>
          <p className="text-text-secondary text-base leading-relaxed mb-4">
            Rebalancing workloads. Waiting for memory to stabilize.
          </p>
          <StagePill stage="monitoring" />
        </div>
        <div className="bg-white/3 rounded-xl ring-1 ring-white/6 p-5">
          <h3 className="text-base font-medium text-text mb-2">Elevated API latency</h3>
          <p className="text-text-secondary text-base leading-relaxed mb-4">
            Likely caused by memory pressure. Investigating.
          </p>
          <StagePill stage="investigation" />
        </div>
      </div>
    </div>
  ),
};

export { Pipeline, WithNeedsYou, InContext };
export default meta;
