import { Search, Lightbulb, ListChecks, Wrench, Eye, CircleCheck, AlertCircle, EyeOff } from 'lucide-react';

type Stage = 'triage' | 'investigation' | 'proposed-plan' | 'implementation' | 'monitoring' | 'resolved' | 'ignored';

type StagePillProps = {
  stage: Stage;
  needsYou?: boolean;
};

const stageConfig: Record<Stage, { label: string; colorClass: string; icon: typeof Search }> = {
  triage: { label: 'Triage', colorClass: 'text-amber-400', icon: Search },
  investigation: { label: 'Investigation', colorClass: 'text-blue-400', icon: Lightbulb },
  'proposed-plan': { label: 'Proposed Plan', colorClass: 'text-blue-400', icon: ListChecks },
  implementation: { label: 'Implementation', colorClass: 'text-blue-400', icon: Wrench },
  monitoring: { label: 'Monitoring', colorClass: 'text-green-400', icon: Eye },
  resolved: { label: 'Resolved', colorClass: 'text-green-400', icon: CircleCheck },
  ignored: { label: 'Ignored', colorClass: 'text-text-muted', icon: EyeOff },
};

const StagePill = ({ stage, needsYou = false }: StagePillProps): React.ReactElement => {
  const cfg = stageConfig[stage];
  const Icon = cfg.icon;

  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`inline-flex items-center gap-1.5 text-sm ${cfg.colorClass}`}>
        <Icon size={14} />
        {cfg.label}
      </span>
      {needsYou && (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
          <AlertCircle size={13} />
          Needs you
        </span>
      )}
    </span>
  );
};

export type { StagePillProps, Stage };
export { StagePill };
