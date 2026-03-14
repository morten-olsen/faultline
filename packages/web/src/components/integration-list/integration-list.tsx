import { motion } from 'motion/react';
import { Plus, KeyRound, GitBranch, Server, Waypoints, Terminal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Tag } from '../tag/tag.tsx';
import type { TagVariant } from '../tag/tag.tsx';

/* ── Integration types ──────────────────────────────────────────── */

type IntegrationType = 'ssh-identity' | 'git-repo' | 'kubernetes' | 'argocd' | 'ssh-connection';

type IntegrationTypeConfig = {
  icon: LucideIcon;
  label: string;
  singular: string;
};

const integrationTypes: Record<IntegrationType, IntegrationTypeConfig> = {
  'ssh-identity': { icon: KeyRound, label: 'SSH Identities', singular: 'SSH Identity' },
  'git-repo': { icon: GitBranch, label: 'Git Repositories', singular: 'Git Repository' },
  kubernetes: { icon: Server, label: 'Kubernetes', singular: 'Kubernetes Context' },
  argocd: { icon: Waypoints, label: 'ArgoCD', singular: 'ArgoCD Instance' },
  'ssh-connection': { icon: Terminal, label: 'SSH Connections', singular: 'SSH Connection' },
};

/* ── Integration item ───────────────────────────────────────────── */

type IntegrationItem = {
  id: string;
  type: IntegrationType;
  name: string;
  detail: string;
  tags?: { label: string; variant: TagVariant }[];
};

/* ── Section header ─────────────────────────────────────────────── */

type SectionHeaderProps = {
  type: IntegrationType;
  onAdd?: () => void;
  delay?: number;
};

const SectionHeader = ({ type, onAdd, delay = 0 }: SectionHeaderProps): React.ReactElement => {
  const config = integrationTypes[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
      className="flex items-center justify-between mb-3 mt-8 first:mt-0"
    >
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-text-muted" />
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{config.label}</span>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="
          flex items-center gap-1 text-xs text-text-muted
          hover:text-text-secondary transition-colors duration-fast cursor-pointer
        "
      >
        <Plus size={12} />
        Add
      </button>
    </motion.div>
  );
};

/* ── Integration row ────────────────────────────────────────────── */

type IntegrationRowProps = {
  item: IntegrationItem;
  delay?: number;
  onClick?: () => void;
};

const IntegrationRow = ({ item, delay = 0, onClick }: IntegrationRowProps): React.ReactElement => {
  const config = integrationTypes[item.type];
  const Icon = config.icon;

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
      <Icon size={14} className="text-text-muted flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text group-hover:text-white transition-colors truncate">{item.name}</span>
          {item.tags?.map((tag) => (
            <Tag key={tag.label} variant={tag.variant}>
              {tag.label}
            </Tag>
          ))}
        </div>
        <p className="text-sm text-text-muted mt-0.5 truncate font-mono">{item.detail}</p>
      </div>
    </motion.div>
  );
};

export type { IntegrationType, IntegrationTypeConfig, IntegrationItem, SectionHeaderProps, IntegrationRowProps };
export { integrationTypes, SectionHeader, IntegrationRow };
