import { Bot, Square, ChevronRight } from 'lucide-react';

type AgentActivityStatus = 'working' | 'waiting' | 'stopped' | 'complete';

type AgentActivityProps = {
  status: AgentActivityStatus;
  label: string;
  elapsed?: string;
  onStop?: () => void;
  onExpand?: () => void;
};

const statusDot: Record<AgentActivityStatus, string> = {
  working: 'bg-blue-400 animate-pulse',
  waiting: 'bg-amber-400 animate-pulse',
  stopped: 'bg-text-muted/40',
  complete: 'bg-green-400/60',
};

const statusLabel: Record<AgentActivityStatus, string> = {
  working: 'Working',
  waiting: 'Waiting for you',
  stopped: 'Stopped',
  complete: 'Done',
};

const AgentActivity = ({ status, label, elapsed, onStop, onExpand }: AgentActivityProps): React.ReactElement => {
  const isActive = status === 'working' || status === 'waiting';

  return (
    <div
      className={`
      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors
      ${isActive ? 'bg-white/4 ring-1 ring-white/6' : 'bg-white/2'}
    `}
    >
      {/* Bot icon + pulse dot */}
      <div className="relative flex-shrink-0">
        <Bot size={16} className={isActive ? 'text-blue-400/70' : 'text-text-muted/40'} />
        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${statusDot[status]}`} />
      </div>

      {/* Label + status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-xs truncate ${isActive ? 'text-text' : 'text-text-muted'}`}>{label}</span>
          <span
            className={`text-xs flex-shrink-0 ${status === 'waiting' ? 'text-amber-400/80' : 'text-text-muted/50'}`}
          >
            {statusLabel[status]}
          </span>
        </div>
      </div>

      {/* Elapsed */}
      {elapsed && <span className="text-xs text-text-muted/40 font-mono flex-shrink-0">{elapsed}</span>}

      {/* Actions */}
      {isActive && onStop && (
        <button
          type="button"
          onClick={onStop}
          className="flex-shrink-0 p-1 rounded-md hover:bg-white/8 transition-colors cursor-pointer group"
          aria-label="Stop agent"
        >
          <Square
            size={12}
            className="text-text-muted/50 group-hover:text-red-400 transition-colors"
            fill="currentColor"
          />
        </button>
      )}

      {onExpand && (
        <button
          type="button"
          onClick={onExpand}
          className="flex-shrink-0 p-1 rounded-md hover:bg-white/8 transition-colors cursor-pointer group"
          aria-label="View transcript"
        >
          <ChevronRight size={13} className="text-text-muted/40 group-hover:text-text transition-colors" />
        </button>
      )}
    </div>
  );
};

export type { AgentActivityProps, AgentActivityStatus };
export { AgentActivity };
