import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Layers, Info } from "lucide-react"
import { useClient } from "../../../client/client.context.js"
import { SettingsShell } from "../../../components/settings-shell/settings-shell.tsx"
import { StageConfigRow } from "../../../components/stage-config-list/stage-config-list.tsx"

import type { StageConfig } from "@faultline/protocol"
import type { StageConfigItem, StageName } from "../../../components/stage-config-list/stage-config-list.tsx"

/* ── Constants ────────────────────────────────────────────────────── */

const allStages: StageName[] = [
  "triage",
  "investigation",
  "proposed-plan",
  "implementation",
  "monitoring",
  "resolved",
  "ignored",
]

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
}

/* ── Helpers ──────────────────────────────────────────────────────── */

const countOrNull = (arr: string[] | null): number | null =>
  arr === null ? null : arr.length

const toStageItems = (configs: StageConfig[]): StageConfigItem[] => {
  const configMap = new Map(configs.map((c) => [c.stage, c]))

  return allStages.map((stage): StageConfigItem => {
    const config = configMap.get(stage)

    if (!config) {
      return { stage, configured: false }
    }

    return {
      stage,
      configured: true,
      allowedCounts: {
        kubeContexts: countOrNull(config.allowedKubeContexts),
        sshConnections: countOrNull(config.allowedSshConnections),
        gitRepos: countOrNull(config.allowedGitRepos),
        argocdInstances: countOrNull(config.allowedArgocdInstances),
      },
      hasAdditionalPrompt: !!config.additionalSystemPrompt,
      hasFallbackIdentity: !!config.sshIdentityId,
    }
  })
}

/* ── Page ─────────────────────────────────────────────────────────── */

const StageConfigsIndex = (): React.ReactElement => {
  const client = useClient()
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ["stageConfigs"],
    queryFn: () => client.call["stageConfigs.list"]({}),
  })

  const configs = data?.configs ?? []
  const items = toStageItems(configs)
  const hasAnyConfigured = configs.length > 0

  return (
    <SettingsShell
      title="Settings"
      tabs={[
        { id: "integrations", label: "Integrations" },
        { id: "stage-configs", label: "Stage Configs" },
      ]}
      activeTab="stage-configs"
      onBack={() => navigate({ to: "/" })}
      onTabChange={(id) => {
        if (id === "integrations") navigate({ to: "/settings/integrations" })
      }}
    >
      {!hasAnyConfigured && (
        <motion.div {...fadeUp}>
          <div className="flex items-start gap-2.5 bg-white/3 rounded-xl px-4 py-3 mb-6">
            <Info size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
            <span className="text-sm text-text-secondary leading-relaxed">
              Stage configs control what the agent can access at each stage of the issue
              lifecycle. Unconfigured stages are unrestricted — the agent can use all
              integrations. Configure a stage to limit access.
            </span>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: hasAnyConfigured ? 0 : 0.06 }}
        className="flex items-center gap-2 mb-3"
      >
        <Layers size={14} className="text-text-muted" />
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          Issue Stages
        </span>
      </motion.div>

      <div className="divide-y divide-white/5">
        {items.map((item, i) => (
          <StageConfigRow
            key={item.stage}
            item={item}
            delay={0.06 + i * 0.04}
            onClick={() => navigate({ to: `/settings/stage-configs/${item.stage}/edit` })}
          />
        ))}
      </div>
    </SettingsShell>
  )
}

/* ── Route ────────────────────────────────────────────────────────── */

const Route = createFileRoute("/settings/stage-configs/")({
  component: StageConfigsIndex,
})

export { Route }
