import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleCheck, Eye, Wrench, Search, Hand, Lightbulb, ListChecks } from 'lucide-react';
import { motion } from 'motion/react';

import { TopBar } from '../../components/top-bar/top-bar.tsx';
import { Input } from '../../components/input/input.tsx';
import { Tag } from '../../components/tag/tag.tsx';

/*
 * Issue Search — find and filter past and present issues.
 *
 * This is where the user goes to:
 *   - Find a specific issue they remember
 *   - Browse all resolved history
 *   - Filter by stage, source, or keyword
 *   - Check if something they noticed is already being tracked
 */

/* ── Animation presets ────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
};

const stagger = (i: number, base = 0) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay: base + i * 0.05 },
});

/* ── Stage config ──────────────────────────────────────────────────── */

const stageIcon = {
  resolved: CircleCheck,
  monitoring: Eye,
  implementation: Wrench,
  'proposed-plan': ListChecks,
  investigation: Lightbulb,
  triage: Search,
} as const;

const stageColor = {
  resolved: 'text-green-500/50',
  monitoring: 'text-green-400/70',
  implementation: 'text-blue-400/70',
  'proposed-plan': 'text-blue-400/70',
  investigation: 'text-blue-400/70',
  triage: 'text-amber-400/70',
} as const;

const stageLabel = {
  resolved: 'Resolved',
  monitoring: 'Monitoring',
  implementation: 'Implementation',
  'proposed-plan': 'Proposed plan',
  investigation: 'Investigation',
  triage: 'Triage',
} as const;

type Stage = keyof typeof stageIcon;

/* ── Filter chip ───────────────────────────────────────────────────── */

type FilterChipProps = {
  label: string;
  active?: boolean;
  index?: number;
  baseDelay?: number;
};

const FilterChip = ({ label, active = false, index = 0, baseDelay = 0 }: FilterChipProps): React.ReactElement => (
  <motion.button
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const, delay: baseDelay + index * 0.03 }}
    type="button"
    className={`
      text-xs px-2.5 py-1 rounded-full cursor-pointer transition-all
      ${
        active
          ? 'bg-white/12 text-text ring-1 ring-white/10'
          : 'bg-white/4 text-text-muted hover:bg-white/8 hover:text-text-secondary'
      }
    `}
  >
    {label}
  </motion.button>
);

/* ── Result row ────────────────────────────────────────────────────── */

type ResultRowProps = {
  title: string;
  summary: string;
  time: string;
  stage: Stage;
  needsYou?: boolean;
  tags?: string[];
  index?: number;
  baseDelay?: number;
};

const ResultRow = ({
  title,
  summary,
  time,
  stage,
  needsYou = false,
  tags,
  index = 0,
  baseDelay = 0,
}: ResultRowProps): React.ReactElement => {
  const Icon = stageIcon[stage];
  return (
    <motion.div
      {...stagger(index, baseDelay)}
      className="group flex items-start gap-3 py-3.5 -mx-2 px-2 rounded-lg cursor-pointer hover:bg-white/3 transition-colors border-b border-white/4 last:border-0"
    >
      <div className="mt-0.5 flex-shrink-0">
        {needsYou ? <Hand size={15} className="text-amber-400/80" /> : <Icon size={15} className={stageColor[stage]} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-text group-hover:text-white transition-colors truncate">{title}</span>
          <span className="text-xs text-text-muted font-mono flex-shrink-0">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-xs ${needsYou ? 'text-amber-400' : stageColor[stage]}`}>
            {needsYou ? 'Needs you' : stageLabel[stage]}
          </span>
          <span className="text-xs text-text-muted/40">·</span>
          <span className="text-xs text-text-muted truncate">{summary}</span>
        </div>
        {tags && tags.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ── Page shell ────────────────────────────────────────────────────── */

const Shell = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <div className="bg-bg min-h-screen font-sans text-text antialiased">
    <div className="max-w-lg mx-auto px-5">
      <TopBar variant="detail" />
      <div className="pt-2 pb-12">{children}</div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════
 * DEFAULT — search page with no query, showing recent issues
 * ══════════════════════════════════════════════════════════════════════ */

const SearchDefault = (): React.ReactElement => (
  <Shell>
    <motion.div {...fadeUp} className="mb-5">
      <Input placeholder="Search issues..." icon={Search} />
    </motion.div>

    {/* Filters */}
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
      <FilterChip label="All" active index={0} baseDelay={0.08} />
      <FilterChip label="Open" index={1} baseDelay={0.08} />
      <FilterChip label="Resolved" index={2} baseDelay={0.08} />
      <FilterChip label="Needs you" index={3} baseDelay={0.08} />
      <div className="w-px h-4 bg-white/8 mx-0.5" />
      <FilterChip label="Kubernetes" index={4} baseDelay={0.08} />
      <FilterChip label="Networking" index={5} baseDelay={0.08} />
      <FilterChip label="Storage" index={6} baseDelay={0.08} />
    </div>

    {/* Results */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mb-3"
    >
      <span className="text-xs text-text-muted">Recent issues</span>
    </motion.div>
    <div>
      <ResultRow
        index={0}
        baseDelay={0.25}
        title="NAS disk showing SMART warnings"
        summary="Disk 3 reporting reallocated sectors. Needs physical swap."
        time="12m"
        stage="implementation"
        needsYou
        tags={['storage']}
      />
      <ResultRow
        index={1}
        baseDelay={0.25}
        title="Memory pressure on node-02 and node-03"
        summary="Moved low-priority workloads. Watching memory settle."
        time="3m"
        stage="monitoring"
        tags={['kubernetes']}
      />
      <ResultRow
        index={2}
        baseDelay={0.25}
        title="Elevated API latency on traefik"
        summary="280ms, normally ~80ms. Likely tied to memory pressure."
        time="2m"
        stage="triage"
        tags={['networking']}
      />
      <ResultRow
        index={3}
        baseDelay={0.25}
        title="CoreDNS entered CrashLoopBackOff"
        summary="Restarted the pod. DNS confirmed healthy."
        time="25m"
        stage="resolved"
        tags={['kubernetes']}
      />
      <ResultRow
        index={4}
        baseDelay={0.25}
        title="Ingress TLS cert expiring in 7 days"
        summary="Renewed wildcard cert. 90 day expiry."
        time="2h"
        stage="resolved"
        tags={['networking']}
      />
      <ResultRow
        index={5}
        baseDelay={0.25}
        title="AP-Living-Room firmware outdated"
        summary="Updated UniFi AP to 6.6.77."
        time="3h"
        stage="resolved"
        tags={['unifi']}
      />
      <ResultRow
        index={6}
        baseDelay={0.25}
        title="Nightly backup completed"
        summary="All persistent volumes snapshotted. 12.4 GB."
        time="6h"
        stage="resolved"
        tags={['storage']}
      />
    </div>
  </Shell>
);

/* ══════════════════════════════════════════════════════════════════════
 * WITH QUERY — filtered results
 * ══════════════════════════════════════════════════════════════════════ */

const SearchFiltered = (): React.ReactElement => (
  <Shell>
    <motion.div {...fadeUp} className="mb-5">
      <Input placeholder="Search issues..." icon={Search} value="memory" />
    </motion.div>

    {/* Filters */}
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
      <FilterChip label="All" index={0} baseDelay={0.08} />
      <FilterChip label="Open" active index={1} baseDelay={0.08} />
      <FilterChip label="Resolved" index={2} baseDelay={0.08} />
      <FilterChip label="Needs you" index={3} baseDelay={0.08} />
      <div className="w-px h-4 bg-white/8 mx-0.5" />
      <FilterChip label="Kubernetes" active index={4} baseDelay={0.08} />
      <FilterChip label="Networking" index={5} baseDelay={0.08} />
      <FilterChip label="Storage" index={6} baseDelay={0.08} />
    </div>

    {/* Active filters */}
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.18 }}
      className="flex items-center gap-2 mb-5"
    >
      <span className="text-xs text-text-muted">Filters:</span>
      <Tag variant="info" removable>
        Open
      </Tag>
      <Tag removable>Kubernetes</Tag>
    </motion.div>

    {/* Results */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.25 }}
      className="mb-3"
    >
      <span className="text-xs text-text-muted">2 results</span>
    </motion.div>
    <div>
      <ResultRow
        index={0}
        baseDelay={0.3}
        title="Memory pressure on node-02 and node-03"
        summary="Moved low-priority workloads. Watching memory settle."
        time="3m"
        stage="monitoring"
        tags={['kubernetes']}
      />
      <ResultRow
        index={1}
        baseDelay={0.3}
        title="Persistent memory pressure across cluster"
        summary="Resurfaced — back above 80%. Trying eviction approach."
        time="14m"
        stage="implementation"
        needsYou
        tags={['kubernetes']}
      />
    </div>
  </Shell>
);

/* ══════════════════════════════════════════════════════════════════════
 * EMPTY STATE — no results found
 * ══════════════════════════════════════════════════════════════════════ */

const SearchEmpty = (): React.ReactElement => (
  <Shell>
    <motion.div {...fadeUp} className="mb-5">
      <Input placeholder="Search issues..." icon={Search} value="grafana dashboard" />
    </motion.div>

    {/* Filters */}
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
      <FilterChip label="All" active index={0} baseDelay={0.08} />
      <FilterChip label="Open" index={1} baseDelay={0.08} />
      <FilterChip label="Resolved" index={2} baseDelay={0.08} />
      <FilterChip label="Needs you" index={3} baseDelay={0.08} />
    </div>

    {/* Empty */}
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.2 }}
      className="text-center py-16"
    >
      <Search size={24} className="text-text-muted/30 mx-auto mb-3" />
      <p className="text-sm text-text-muted mb-1">No issues match your search</p>
      <p className="text-xs text-text-muted/60">Try a different query or remove some filters</p>
    </motion.div>
  </Shell>
);

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Pages/Issue Search',
  parameters: {
    layout: 'fullscreen',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
};

type Story = StoryObj;

const Default: Story = { render: SearchDefault };
const Filtered: Story = { render: SearchFiltered };
const Empty: Story = { render: SearchEmpty };

export { Default, Filtered, Empty };
export default meta;
