import type { Meta, StoryObj } from '@storybook/react-vite'
import { Search, Filter, Terminal } from 'lucide-react'
import { Input } from '../../components/input/input.tsx'

/*
 * Input
 *
 * Inputs are uncommon in Faultline — the system runs autonomously, so there's
 * rarely a form to fill out. When they do appear, it's usually for search,
 * filtering resolved issues, or the rare manual override that needs a value.
 * They should feel calm and recessive, not like a form field demanding attention.
 */

const meta: Meta<typeof Input> = {
  title: 'Design System/Components/Input',
  component: Input,
  parameters: {
    layout: 'padded',
  },
}

type Story = StoryObj<typeof Input>

const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        The default input is quiet — a dark surface with a subtle border that
        brightens on focus. No labels built in; those live outside the component
        so layout stays flexible.
      </p>
      <div className="flex flex-col gap-4">
        <Input placeholder="Search resolved issues..." />
        <Input value="node-03" />
      </div>
    </div>
  ),
}

const WithIcon: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        A leading icon provides context. Search gets a magnifying glass,
        filter gets a funnel, commands get a terminal prompt. The icon
        is muted until the input is focused.
      </p>
      <div className="flex flex-col gap-4">
        <Input placeholder="Search..." icon={Search} />
        <Input placeholder="Filter by namespace..." icon={Filter} />
        <Input placeholder="kubectl get pods..." icon={Terminal} />
      </div>
    </div>
  ),
}

const States: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Error states use a subtle red border and a message below — never
        aggressive, but clear. Disabled inputs fade like disabled buttons.
      </p>
      <div className="flex flex-col gap-5">
        <div>
          <label className="text-text-secondary text-sm mb-1.5 block">Normal</label>
          <Input placeholder="Enter a value..." />
        </div>
        <div>
          <label className="text-text-secondary text-sm mb-1.5 block">With error</label>
          <Input value="not-a-valid-node" error="No node found with this name" />
        </div>
        <div>
          <label className="text-text-secondary text-sm mb-1.5 block">Disabled</label>
          <Input value="Managed by system" disabled />
        </div>
      </div>
    </div>
  ),
}

export { Default, WithIcon, States }
export default meta
