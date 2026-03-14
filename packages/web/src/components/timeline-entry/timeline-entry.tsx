import { Search, Wrench, CircleCheck, Hand, UserCheck, RotateCcw, Lightbulb } from 'lucide-react';

type TimelineEventKind =
  | 'detected'
  | 'analysis'
  | 'action'
  | 'outcome'
  | 'regression'
  | 'needs-you'
  | 'user-action'
  | 'resolved';

type TimelineEventStatus = 'success' | 'failure' | 'pending' | 'info';

type TimelineEntryProps = {
  kind: TimelineEventKind;
  status: TimelineEventStatus;
  title: string;
  time: string;
  body?: string;
  commandRun?: string;
  isLast?: boolean;
};

const kindIcon: Record<TimelineEventKind, typeof Search> = {
  detected: Search,
  analysis: Lightbulb,
  action: Wrench,
  outcome: CircleCheck,
  regression: RotateCcw,
  'needs-you': Hand,
  'user-action': UserCheck,
  resolved: CircleCheck,
};

const dotColor = (kind: TimelineEventKind, status: TimelineEventStatus): string => {
  if (kind === 'needs-you') {
    return 'text-amber-400';
  }
  if (kind === 'user-action') {
    return 'text-text-muted';
  }
  if (kind === 'regression') {
    return 'text-amber-400';
  }
  if (kind === 'resolved') {
    return 'text-green-400';
  }
  if (status === 'success') {
    return 'text-green-400';
  }
  if (status === 'failure') {
    return 'text-red-400';
  }
  if (status === 'pending') {
    return 'text-amber-400';
  }
  return 'text-blue-400';
};

const TimelineEntry = ({
  kind,
  status,
  title,
  time,
  body,
  commandRun,
  isLast = false,
}: TimelineEntryProps): React.ReactElement => {
  const Icon = kindIcon[kind];
  const color = dotColor(kind, status);
  const dimmed = kind === 'user-action';

  return (
    <div className="relative flex gap-3 pb-6 last:pb-0">
      {/* Rail line */}
      {!isLast && <div className="absolute left-[9px] top-6 bottom-0 w-px bg-white/6" />}

      {/* Dot */}
      <div className={`relative flex-shrink-0 mt-0.5 ${color}`}>
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 -mt-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className={`text-sm font-medium ${dimmed ? 'text-text-muted' : 'text-text'}`}>{title}</span>
          <span className="text-xs text-text-muted font-mono flex-shrink-0">{time}</span>
        </div>
        {body && (
          <p className={`text-sm leading-relaxed mt-1.5 ${dimmed ? 'text-text-muted' : 'text-text-secondary'}`}>
            {body}
          </p>
        )}
        {commandRun && (
          <pre className="text-xs font-mono text-text-secondary bg-white/4 rounded-lg px-3 py-2 mt-2 overflow-x-auto">
            {commandRun}
          </pre>
        )}
      </div>
    </div>
  );
};

export type { TimelineEntryProps, TimelineEventKind, TimelineEventStatus };
export { TimelineEntry };
