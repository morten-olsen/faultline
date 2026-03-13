import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Plus, Search, Wrench, Eye, CircleCheck, Lightbulb, ListChecks, EyeOff } from "lucide-react"
import { useClient } from "../../client/client.context.js"
import { PageShell } from "../../components/page-shell/page-shell.tsx"
import { IconButton } from "../../components/icon-button/icon-button.tsx"
import { Button } from "../../components/button/button.tsx"

import type { LucideIcon } from "lucide-react"

const stageConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  triage: { label: "Triage", color: "text-amber-400", icon: Search },
  investigation: { label: "Investigation", color: "text-blue-400", icon: Lightbulb },
  "proposed-plan": { label: "Proposed Plan", color: "text-blue-400", icon: ListChecks },
  implementation: { label: "Implementation", color: "text-blue-400", icon: Wrench },
  monitoring: { label: "Monitoring", color: "text-green-400", icon: Eye },
  resolved: { label: "Resolved", color: "text-green-400", icon: CircleCheck },
  ignored: { label: "Ignored", color: "text-text-muted", icon: EyeOff },
}

const IssuesList = (): React.ReactElement => {
  const client = useClient()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ["issues"],
    queryFn: () => client.call["issues.list"]({}),
    refetchInterval: 3000,
  })

  const issues = data?.issues ?? []

  return (
    <PageShell>
      <div className="flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} label="Back" size="sm" onClick={() => navigate({ to: "/" })} />
          <span className="text-sm font-medium tracking-tight">Issues</span>
        </div>
        <Button variant="secondary" size="sm" icon={Plus} onClick={() => navigate({ to: "/issues/new" })}>
          New
        </Button>
      </div>

      <div className="pt-2 pb-12">
        {isLoading && (
          <p className="text-sm text-text-muted py-8 text-center">Loading…</p>
        )}

        {!isLoading && issues.length === 0 && (
          <p className="text-sm text-text-muted py-8 text-center">No issues yet.</p>
        )}

        <div className="space-y-1">
          {issues.map((issue) => {
            const fallback = { label: "Unknown", color: "text-text-muted", icon: Search }
            const cfg = stageConfig[issue.stage] ?? fallback
            const StageIcon = cfg.icon

            return (
              <div
                key={issue.id}
                className="group flex items-start gap-3 py-3 -mx-2 px-2 rounded-lg cursor-pointer hover:bg-white/3 transition-colors"
              >
                <div className="mt-0.5 flex-shrink-0">
                  <StageIcon size={15} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-text group-hover:text-white transition-colors truncate">
                      {issue.title}
                    </span>
                    <span className="text-xs text-text-muted font-mono flex-shrink-0">
                      {issue.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                    {issue.needsYou && (
                      <>
                        <span className="text-xs text-text-muted/40">·</span>
                        <span className="text-xs text-amber-400">Needs you</span>
                      </>
                    )}
                    {issue.summary && (
                      <>
                        <span className="text-xs text-text-muted/40">·</span>
                        <span className="text-xs text-text-muted truncate">{issue.summary}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}

const Route = createFileRoute("/issues/")({
  component: IssuesList,
})

export { Route }
