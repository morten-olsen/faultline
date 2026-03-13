import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useClient } from "../../../client/client.context.js"
import { IntegrationForm } from "../../../components/integration-form/integration-form.tsx"
import { FormField } from "../../../components/form-field/form-field.tsx"
import { TextArea } from "../../../components/text-area/text-area.tsx"
import { Select } from "../../../components/select/select.tsx"
import { AnimatedField } from "../../../components/animated-field/animated-field.tsx"
import { AllowanceField } from "../../../components/allowance-field/allowance-field.tsx"
import { stageDisplay } from "../../../components/stage-config-list/stage-config-list.tsx"

import type { AllowanceMode, AllowanceOption } from "../../../components/allowance-field/allowance-field.tsx"
import type { StageName } from "../../../components/stage-config-list/stage-config-list.tsx"

/* ── Helpers ──────────────────────────────────────────────────────── */

const toMode = (arr: string[] | null): AllowanceMode => {
  if (arr === null) return "all"
  if (arr.length === 0) return "none"
  return "select"
}

const fromMode = (mode: AllowanceMode, selected: string[]): string[] | null => {
  if (mode === "all") return null
  if (mode === "none") return []
  return selected
}

/* ── Page ─────────────────────────────────────────────────────────── */

const EditStageConfig = (): React.ReactElement => {
  const { stage } = Route.useParams()
  const client = useClient()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const stageLabel = stageDisplay[stage as StageName]?.label ?? stage

  // Fetch existing config (may be null for unconfigured stages)
  const { data: configData } = useQuery({
    queryKey: ["stageConfig", stage],
    queryFn: () => client.call["stageConfigs.get"]({ stage }),
  })

  // Fetch integration lists for the AllowanceField dropdowns
  const { data: kubeData } = useQuery({
    queryKey: ["kubeContexts"],
    queryFn: () => client.call["kubeContexts.list"]({}),
  })
  const { data: sshConnData } = useQuery({
    queryKey: ["sshConnections"],
    queryFn: () => client.call["sshConnections.list"]({}),
  })
  const { data: gitData } = useQuery({
    queryKey: ["gitRepos"],
    queryFn: () => client.call["gitRepos.list"]({}),
  })
  const { data: argoData } = useQuery({
    queryKey: ["argoInstances"],
    queryFn: () => client.call["argoInstances.list"]({}),
  })
  const { data: identitiesData } = useQuery({
    queryKey: ["sshIdentities"],
    queryFn: () => client.call["sshIdentities.list"]({}),
  })

  const config = configData?.config ?? null
  const isEdit = config !== null

  // Build option lists
  const kubeOptions: AllowanceOption[] = (kubeData?.contexts ?? []).map((c) => ({
    value: c.id,
    label: c.name,
  }))
  const sshConnOptions: AllowanceOption[] = (sshConnData?.connections ?? []).map((c) => ({
    value: c.id,
    label: `${c.name} (${c.username}@${c.host})`,
  }))
  const gitOptions: AllowanceOption[] = (gitData?.repos ?? []).map((r) => ({
    value: r.id,
    label: r.name,
  }))
  const argoOptions: AllowanceOption[] = (argoData?.instances ?? []).map((i) => ({
    value: i.id,
    label: i.name,
  }))
  const identityOptions = (identitiesData?.identities ?? []).map((i) => ({
    value: i.id,
    label: i.name,
  }))

  // Form state
  const [kubeMode, setKubeMode] = useState<AllowanceMode>("all")
  const [kubeSelected, setKubeSelected] = useState<string[]>([])
  const [sshConnMode, setSshConnMode] = useState<AllowanceMode>("all")
  const [sshConnSelected, setSshConnSelected] = useState<string[]>([])
  const [gitMode, setGitMode] = useState<AllowanceMode>("all")
  const [gitSelected, setGitSelected] = useState<string[]>([])
  const [argoMode, setArgoMode] = useState<AllowanceMode>("all")
  const [argoSelected, setArgoSelected] = useState<string[]>([])
  const [sshIdentityId, setSshIdentityId] = useState("")
  const [additionalPrompt, setAdditionalPrompt] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (configData && !loaded) {
      if (config) {
        setKubeMode(toMode(config.allowedKubeContexts))
        setKubeSelected(config.allowedKubeContexts ?? [])
        setSshConnMode(toMode(config.allowedSshConnections))
        setSshConnSelected(config.allowedSshConnections ?? [])
        setGitMode(toMode(config.allowedGitRepos))
        setGitSelected(config.allowedGitRepos ?? [])
        setArgoMode(toMode(config.allowedArgocdInstances))
        setArgoSelected(config.allowedArgocdInstances ?? [])
        setSshIdentityId(config.sshIdentityId ?? "")
        setAdditionalPrompt(config.additionalSystemPrompt ?? "")
      }
      setLoaded(true)
    }
  }, [configData, config, loaded])

  const upsertMutation = useMutation({
    mutationFn: () =>
      client.call["stageConfigs.upsert"]({
        stage,
        allowedKubeContexts: fromMode(kubeMode, kubeSelected),
        allowedSshConnections: fromMode(sshConnMode, sshConnSelected),
        allowedGitRepos: fromMode(gitMode, gitSelected),
        allowedArgocdInstances: fromMode(argoMode, argoSelected),
        sshIdentityId: sshIdentityId || null,
        additionalSystemPrompt: additionalPrompt || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stageConfigs"] })
      queryClient.invalidateQueries({ queryKey: ["stageConfig", stage] })
      navigate({ to: "/settings/stage-configs" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => client.call["stageConfigs.delete"]({ stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stageConfigs"] })
      navigate({ to: "/settings/stage-configs" })
    },
  })

  // Wait for the initial config fetch before rendering
  if (!configData) return <div />

  return (
    <IntegrationForm
      title={`${stageLabel} — Stage Config`}
      isEdit={isEdit}
      saving={upsertMutation.isPending}
      onBack={() => navigate({ to: "/settings/stage-configs" })}
      onSave={() => upsertMutation.mutate()}
      onDelete={isEdit ? () => deleteMutation.mutate() : undefined}
    >
      <AnimatedField index={0}>
        <AllowanceField
          label="Kubernetes contexts"
          description="Which clusters the agent can access at this stage"
          mode={kubeMode}
          selected={kubeSelected}
          options={kubeOptions}
          onModeChange={(m) => {
            setKubeMode(m)
            if (m !== "select") setKubeSelected([])
          }}
          onAdd={(v) => setKubeSelected((prev) => [...prev, v])}
          onRemove={(v) => setKubeSelected((prev) => prev.filter((id) => id !== v))}
        />
      </AnimatedField>

      <AnimatedField index={1}>
        <AllowanceField
          label="SSH connections"
          description="Which hosts the agent can SSH into"
          mode={sshConnMode}
          selected={sshConnSelected}
          options={sshConnOptions}
          onModeChange={(m) => {
            setSshConnMode(m)
            if (m !== "select") setSshConnSelected([])
          }}
          onAdd={(v) => setSshConnSelected((prev) => [...prev, v])}
          onRemove={(v) => setSshConnSelected((prev) => prev.filter((id) => id !== v))}
        />
      </AnimatedField>

      <AnimatedField index={2}>
        <AllowanceField
          label="Git repositories"
          description="Which repos the agent can clone"
          mode={gitMode}
          selected={gitSelected}
          options={gitOptions}
          onModeChange={(m) => {
            setGitMode(m)
            if (m !== "select") setGitSelected([])
          }}
          onAdd={(v) => setGitSelected((prev) => [...prev, v])}
          onRemove={(v) => setGitSelected((prev) => prev.filter((id) => id !== v))}
        />
      </AnimatedField>

      <AnimatedField index={3}>
        <AllowanceField
          label="ArgoCD instances"
          description="Which ArgoCD instances the agent can query"
          mode={argoMode}
          selected={argoSelected}
          options={argoOptions}
          onModeChange={(m) => {
            setArgoMode(m)
            if (m !== "select") setArgoSelected([])
          }}
          onAdd={(v) => setArgoSelected((prev) => [...prev, v])}
          onRemove={(v) => setArgoSelected((prev) => prev.filter((id) => id !== v))}
        />
      </AnimatedField>

      <AnimatedField index={4}>
        <FormField
          label="Fallback SSH identity"
          description="Used when an SSH connection doesn't have its own identity set"
        >
          <Select
            value={sshIdentityId}
            onChange={(v) => setSshIdentityId(v)}
            placeholder="None"
            options={identityOptions}
          />
        </FormField>
      </AnimatedField>

      <AnimatedField index={5}>
        <FormField
          label="Additional system prompt"
          description="Appended to the agent's system prompt when working on issues at this stage"
        >
          <TextArea
            value={additionalPrompt}
            onChange={(v) => setAdditionalPrompt(v)}
            placeholder="Any additional instructions for the agent at this stage…"
            rows={3}
          />
        </FormField>
      </AnimatedField>
    </IntegrationForm>
  )
}

/* ── Route ────────────────────────────────────────────────────────── */

const Route = createFileRoute("/settings/stage-configs/$stage/edit")({
  component: EditStageConfig,
})

export { Route }
