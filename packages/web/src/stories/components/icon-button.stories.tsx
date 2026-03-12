import type { Meta, StoryObj } from '@storybook/react-vite'
import { X, MoreHorizontal, ChevronDown, Pause, Play, ExternalLink, Trash2, Settings, Eye } from 'lucide-react'
import { IconButton } from '../../components/icon-button/icon-button.tsx'

/*
 * Icon Button
 *
 * For actions that don't need a label — closing a panel, opening a menu,
 * toggling a state. These are the quiet controls that sit at the edges
 * of cards and toolbars. Ghost by default, because most of the time
 * they should recede until the user reaches for them.
 */

const meta: Meta<typeof IconButton> = {
  title: 'Design System/Components/Icon Button',
  component: IconButton,
  parameters: {
    layout: 'padded',
  },
}

type Story = StoryObj<typeof IconButton>

const Variants: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Ghost is the default — nearly invisible until hovered. Secondary has a
        background for when the button needs to be discoverable without interaction.
        Danger is for destructive actions like dismissing or deleting.
      </p>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-sm w-24">Ghost</span>
          <IconButton icon={X} label="Close" />
          <IconButton icon={MoreHorizontal} label="More" />
          <IconButton icon={ChevronDown} label="Expand" />
          <IconButton icon={Eye} label="View" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-sm w-24">Secondary</span>
          <IconButton icon={Settings} label="Settings" variant="secondary" />
          <IconButton icon={ExternalLink} label="Open" variant="secondary" />
          <IconButton icon={Pause} label="Pause" variant="secondary" />
          <IconButton icon={Play} label="Resume" variant="secondary" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-sm w-24">Danger</span>
          <IconButton icon={Trash2} label="Delete" variant="danger" />
          <IconButton icon={X} label="Dismiss" variant="danger" />
        </div>
      </div>
    </div>
  ),
}

const Sizes: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Small for inline use (table rows, tag close buttons). Medium is the
        default. Large for standalone controls.
      </p>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <IconButton icon={X} label="Close" size="sm" variant="secondary" />
          <span className="text-text-muted text-xs">sm</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <IconButton icon={X} label="Close" size="md" variant="secondary" />
          <span className="text-text-muted text-xs">md</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <IconButton icon={X} label="Close" size="lg" variant="secondary" />
          <span className="text-text-muted text-xs">lg</span>
        </div>
      </div>
    </div>
  ),
}

const InContext: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <p className="text-text-secondary text-base leading-relaxed mb-8 max-w-lg">
        Icon buttons at the edges of a card — dismiss, expand, external link.
        They're visible but don't compete with the content.
      </p>
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-medium text-text">Memory pressure on node-02</h3>
          <div className="flex items-center gap-1">
            <IconButton icon={ExternalLink} label="Open in Grafana" size="sm" />
            <IconButton icon={MoreHorizontal} label="More actions" size="sm" />
          </div>
        </div>
        <p className="text-text-secondary text-base leading-relaxed">
          Node is at 84% memory. Rebalancing workloads to free up space.
        </p>
      </div>
    </div>
  ),
}

export { Variants, Sizes, InContext }
export default meta
