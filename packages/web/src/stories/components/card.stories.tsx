import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRight, Hand } from 'lucide-react';

import { Card, CardHeader, CardBody, CardFooter, CardCallout } from '../../components/card/card.tsx';
import { StagePill } from '../../components/stage-pill/stage-pill.tsx';
import { Tag } from '../../components/tag/tag.tsx';
import { Button } from '../../components/button/button.tsx';
const meta: Meta<typeof Card> = {
  title: 'Design System/Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
};

type Story = StoryObj<typeof Card>;

const Variants: Story = {
  render: () => (
    <div className="max-w-xl flex flex-col gap-4">
      <p className="text-text-secondary text-sm leading-relaxed mb-4 max-w-lg">
        Cards are the primary container. The variant communicates the nature of the content — most cards are default or
        issue; "needs you" is reserved for items genuinely blocked on the user.
      </p>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium text-text">Default card</h3>
        </CardHeader>
        <CardBody>The standard container. Resolved lists, informational sections.</CardBody>
      </Card>

      <Card variant="issue" interactive>
        <CardHeader trailing={<span className="text-xs font-mono text-text-muted">3m</span>}>
          <h3 className="text-sm font-medium text-text">Issue card</h3>
          <Tag variant="info">In Progress</Tag>
        </CardHeader>
        <CardBody>An active issue in the pipeline. Interactive — hover reveals the ring brightening.</CardBody>
        <CardFooter>
          <StagePill stage="implementation" />
          <Button variant="ghost" size="sm" iconRight={ArrowRight}>
            Details
          </Button>
        </CardFooter>
      </Card>

      <Card variant="needs-you">
        <div className="flex items-center gap-2 mb-2">
          <Hand size={15} className="text-amber-400/80" />
          <h3 className="text-sm font-medium text-text">Needs you card</h3>
        </div>
        <CardBody>
          Amber tint — a colleague asking for help, not an alarm. The pipeline is paused until the user acts.
        </CardBody>
        <CardCallout>This is a callout — it explains exactly what the user needs to do.</CardCallout>
        <CardFooter>
          <StagePill stage="proposed-plan" needsYou />
          <Button variant="ghost" size="sm" iconRight={ArrowRight}>
            Details
          </Button>
        </CardFooter>
      </Card>

      <Card variant="subtle">
        <CardBody>Subtle variant — minimal styling for nested or secondary content.</CardBody>
      </Card>
    </div>
  ),
};

const ComposedIssue: Story = {
  render: () => (
    <div className="max-w-xl flex flex-col gap-4">
      <p className="text-text-secondary text-sm leading-relaxed mb-4 max-w-lg">
        A fully composed issue card using all sub-components — how they appear on the home page.
      </p>

      <Card variant="needs-you">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Hand size={15} className="text-amber-400/80 flex-shrink-0" />
            <h3 className="text-sm font-medium text-text">NAS disk showing SMART warnings</h3>
          </div>
          <span className="text-xs font-mono text-text-muted flex-shrink-0">12m</span>
        </div>
        <CardBody>
          Disk 3 is reporting reallocated sectors. The array is degraded but online. This needs a physical disk swap.
        </CardBody>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm">
            I'll replace it
          </Button>
          <Button variant="ghost" size="sm" iconRight={ArrowRight}>
            Details
          </Button>
        </div>
      </Card>

      <Card variant="issue" interactive>
        <CardHeader trailing={<span className="text-xs font-mono text-text-muted">3m</span>}>
          <h3 className="text-sm font-medium text-text">Memory pressure on node-02 and node-03</h3>
          <Tag>kubernetes</Tag>
        </CardHeader>
        <CardBody>Both nodes above 80% memory. Low-priority workloads moved to node-01.</CardBody>
        <CardFooter>
          <StagePill stage="monitoring" />
          <Button variant="ghost" size="sm" iconRight={ArrowRight}>
            Details
          </Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

export { Variants, ComposedIssue };
export default meta;
