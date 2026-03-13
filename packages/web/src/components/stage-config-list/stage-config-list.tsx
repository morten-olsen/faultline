import { motion } from 'motion/react'
import {
  Search, Lightbulb, ListChecks, Wrench, Eye, CircleCheck, EyeOff, Settings2, Plus,
} from 'lucide-react'
import { Tag } from '../tag/tag.tsx'

import type { LucideIcon } from 'lucide-react'
import type { TagVariant } from '../tag/tag.tsx'

/* ── Stage metadata ──────────────────────────────────────────────── */

type StageName =
  | 'triage'
  | 'investigation'
  | 'proposed-plan'
  | 'implementation'
  | 'monitoring'
  | 'resolved'
  | 'ignored'

type StageDisplayConfig = {
  label: string
  icon: LucideIcon
  colorClass: string
}

const stageDisplay: Record<StageName, StageDisplayConfig> = {
  triage: { label: 'Triage', icon: Search, colorClass: 'text-amber-400' },
  investigation: { label: 'Investigation', icon: Lightbulb, colorClass: 'text-blue-400' },
  'proposed-plan': { label: 'Proposed Plan', icon: ListChecks, colorClass: 'text-blue-400' },
  implementation: { label: 'Implementation', icon: Wrench, colorClass: 'text-blue-400' },
  monitoring: { label: 'Monitoring', icon: Eye, colorClass: 'text-green-400' },
  resolved: { label: 'Resolved', icon: CircleCheck, colorClass: 'text-green-400' },
  ignored: { label: 'Ignored', icon: EyeOff, colorClass: 'text-text-muted' },
}

/* ── Stage config item ───────────────────────────────────────────── */

type StageConfigItem = {
  stage: StageName
  configured: boolean
  allowedCounts?: {
    kubeContexts: number | null
    sshConnections: number | null
    gitRepos: number | null
    argocdInstances: number | null
  }
  hasAdditionalPrompt?: boolean
  hasFallbackIdentity?: boolean
}

/* ── Stage config row ────────────────────────────────────────────── */

type StageConfigRowProps = {
  item: StageConfigItem
  delay?: number
  onClick?: () => void
}

const scopeLabel = (count: number | null | undefined, label: string): string | null => {
  if (count === null || count === undefined) return null
  if (count === 0) return `no ${label}`
  return `${count} ${label}`
}

const StageConfigRow = ({ item, delay = 0, onClick }: StageConfigRowProps): React.ReactElement => {
  const display = stageDisplay[item.stage]
  const Icon = display.icon

  const tags: { label: string; variant: TagVariant }[] = []

  if (item.configured && item.allowedCounts) {
    const scopes = [
      scopeLabel(item.allowedCounts.kubeContexts, 'kube'),
      scopeLabel(item.allowedCounts.sshConnections, 'ssh'),
      scopeLabel(item.allowedCounts.gitRepos, 'git'),
      scopeLabel(item.allowedCounts.argocdInstances, 'argo'),
    ].filter(Boolean)

    for (const scope of scopes) {
      tags.push({ label: scope!, variant: 'default' })
    }
  }

  if (item.hasFallbackIdentity) {
    tags.push({ label: 'fallback key', variant: 'info' })
  }

  if (item.hasAdditionalPrompt) {
    tags.push({ label: 'custom prompt', variant: 'info' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const, delay }}
      onClick={onClick}
      className="
        group flex items-center gap-3 py-3 -mx-2 px-2
        rounded-lg cursor-pointer hover:bg-white/3 transition-colors
      "
    >
      <Icon size={14} className={`${display.colorClass} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text group-hover:text-white transition-colors">
            {display.label}
          </span>
          {item.configured ? (
            tags.map((tag) => (
              <Tag key={tag.label} variant={tag.variant}>{tag.label}</Tag>
            ))
          ) : (
            <span className="text-sm text-text-muted">unrestricted</span>
          )}
        </div>
      </div>
      {item.configured ? (
        <Settings2 size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      ) : (
        <Plus size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </motion.div>
  )
}

export type { StageName, StageConfigItem, StageConfigRowProps }
export { stageDisplay, StageConfigRow }
