type MonitoringProgressProps = {
  plan: string
  nextCheckIn: string
  checksCompleted: number
  totalChecks: number
  intervalMinutes: number
}

const MonitoringProgress = ({
  plan,
  nextCheckIn,
  checksCompleted,
  totalChecks,
  intervalMinutes,
}: MonitoringProgressProps): React.ReactElement => {
  const progress = totalChecks > 0 ? checksCompleted / totalChecks : 0

  return (
    <div className="space-y-2.5">
      <p className="text-sm text-text-secondary leading-relaxed">{plan}</p>

      {/* Progress bar */}
      <div className="h-1 bg-white/6 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-400/50 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>

      {/* Status text */}
      <p className="text-xs text-text-muted">
        Checking every {intervalMinutes} min
        <span className="text-text-muted/40 mx-1.5">&middot;</span>
        {checksCompleted} of {totalChecks} checks passed
        <span className="text-text-muted/40 mx-1.5">&middot;</span>
        Next check in {nextCheckIn}
      </p>
    </div>
  )
}

export type { MonitoringProgressProps }
export { MonitoringProgress }
