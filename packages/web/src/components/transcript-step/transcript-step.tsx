import {
  Brain, Terminal, FileText, MessageSquare,
  AlertCircle, CheckCircle2, Loader2, ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

type TranscriptStepKind =
  | 'thinking'
  | 'tool-call'
  | 'tool-result'
  | 'message'
  | 'error'

type TranscriptStepStatus = 'running' | 'complete' | 'failed'

type TranscriptStepProps = {
  kind: TranscriptStepKind
  status?: TranscriptStepStatus
  title: string
  detail?: string
  output?: string
  duration?: string
  collapsible?: boolean
  defaultOpen?: boolean
  isLast?: boolean
}

const kindIcon: Record<TranscriptStepKind, typeof Brain> = {
  thinking: Brain,
  'tool-call': Terminal,
  'tool-result': FileText,
  message: MessageSquare,
  error: AlertCircle,
}

const kindColor: Record<TranscriptStepKind, string> = {
  thinking: 'text-blue-400/60',
  'tool-call': 'text-blue-400/80',
  'tool-result': 'text-text-muted/60',
  message: 'text-text-secondary',
  error: 'text-red-400/80',
}

const statusIndicator = (status: TranscriptStepStatus): React.ReactElement | null => {
  if (status === 'running') {
    return <Loader2 size={12} className="text-blue-400 animate-spin" />
  }
  if (status === 'failed') {
    return <AlertCircle size={12} className="text-red-400" />
  }
  if (status === 'complete') {
    return <CheckCircle2 size={12} className="text-text-muted/40" />
  }
  return null
}

const TranscriptStep = ({
  kind,
  status = 'complete',
  title,
  detail,
  output,
  duration,
  collapsible = false,
  defaultOpen = false,
  isLast = false,
}: TranscriptStepProps): React.ReactElement => {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = kindIcon[kind]
  const color = kind === 'error' ? 'text-red-400/80' : kindColor[kind]
  const hasExpandable = collapsible && (detail || output)

  return (
    <div className="relative flex gap-2.5 pb-3 last:pb-0">
      {/* Rail */}
      {!isLast && (
        <div className="absolute left-[8px] top-5 bottom-0 w-px bg-white/5" />
      )}

      {/* Icon */}
      <div className={`relative flex-shrink-0 mt-0.5 ${color}`}>
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {hasExpandable ? (
            <button
              type="button"
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors group"
            >
              <span className={`text-xs ${status === 'running' ? 'text-text' : 'text-text-secondary'} group-hover:text-white transition-colors`}>
                {title}
              </span>
              <ChevronDown
                size={11}
                className={`text-text-muted/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>
          ) : (
            <span className={`text-xs ${status === 'running' ? 'text-text' : 'text-text-secondary'}`}>
              {title}
            </span>
          )}
          {statusIndicator(status)}
          {duration && (
            <span className="text-xs text-text-muted/40 font-mono">{duration}</span>
          )}
        </div>

        {/* Inline detail (always visible if not collapsible) */}
        {detail && !collapsible && (
          <p className="text-xs text-text-muted leading-relaxed mt-1">{detail}</p>
        )}

        {/* Collapsible content */}
        {hasExpandable && open && (
          <div className="mt-2 space-y-2">
            {detail && (
              <p className="text-xs text-text-muted leading-relaxed">{detail}</p>
            )}
            {output && (
              <pre className="text-xs font-mono text-text-muted bg-white/3 rounded-lg px-3 py-2 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                {output}
              </pre>
            )}
          </div>
        )}

        {/* Non-collapsible output */}
        {output && !collapsible && (
          <pre className="text-xs font-mono text-text-muted bg-white/3 rounded-lg px-3 py-2 mt-2 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
            {output}
          </pre>
        )}
      </div>
    </div>
  )
}

export type { TranscriptStepProps, TranscriptStepKind, TranscriptStepStatus }
export { TranscriptStep }
