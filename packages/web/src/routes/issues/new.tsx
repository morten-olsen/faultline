import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useClient } from "../../client/client.context.js"
import { IntegrationForm } from "../../components/integration-form/integration-form.tsx"
import { FormField } from "../../components/form-field/form-field.tsx"
import { Input } from "../../components/input/input.tsx"
import { TextArea } from "../../components/text-area/text-area.tsx"
import { Select } from "../../components/select/select.tsx"
import { AnimatedField } from "../../components/animated-field/animated-field.tsx"

const priorityOptions = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const stageOptions = [
  { value: "triage", label: "Triage" },
  { value: "investigation", label: "Investigation" },
  { value: "proposed-plan", label: "Proposed Plan" },
  { value: "implementation", label: "Implementation" },
  { value: "monitoring", label: "Monitoring" },
]

const NewIssue = (): React.ReactElement => {
  const client = useClient()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [source, setSource] = useState("manual")
  const [priority, setPriority] = useState("medium")
  const [stage, setStage] = useState("triage")
  const [summary, setSummary] = useState("")
  const [description, setDescription] = useState("")
  const [sourcePayload, setSourcePayload] = useState("")

  const mutation = useMutation({
    mutationFn: () =>
      client.call["issues.create"]({
        fingerprint: `manual-${Date.now()}`,
        source,
        title,
        summary: summary || null,
        description: description || null,
        stage: stage as "triage",
        priority: priority as "medium",
        sourcePayload: sourcePayload || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] })
      navigate({ to: "/issues" })
    },
  })

  const canSave = title.trim().length > 0

  return (
    <IntegrationForm
      title="New Issue"
      saving={mutation.isPending}
      onBack={() => navigate({ to: "/issues" })}
      onSave={() => canSave && mutation.mutate()}
    >
      <AnimatedField index={0}>
        <FormField label="Title" description="What's happening">
          <Input placeholder="Memory above 80% on node-02" value={title} onChange={(v) => setTitle(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={1}>
        <FormField label="Priority">
          <Select value={priority} onChange={(v) => setPriority(v)} options={priorityOptions} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={2}>
        <FormField label="Starting stage" description="The orchestrator will dispatch an agent from this stage">
          <Select value={stage} onChange={(v) => setStage(v)} options={stageOptions} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={3}>
        <FormField label="Source" description="Where this issue came from">
          <Input placeholder="manual" value={source} onChange={(v) => setSource(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={4}>
        <FormField label="Summary" description="Optional one-liner">
          <Input placeholder="node-02 at 84%, threshold is 80%" value={summary} onChange={(v) => setSummary(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={5}>
        <FormField label="Description" description="Optional details for the agent to work with">
          <TextArea
            placeholder="AlertManager fired KubeNodeMemoryPressure for node-02..."
            rows={3}
            value={description}
            onChange={(v) => setDescription(v)}
          />
        </FormField>
      </AnimatedField>

      <AnimatedField index={6}>
        <FormField label="Source payload" description="Optional raw alert JSON for the agent to analyze">
          <TextArea
            placeholder='{"alerts": [...]}'
            rows={4}
            mono
            value={sourcePayload}
            onChange={(v) => setSourcePayload(v)}
          />
        </FormField>
      </AnimatedField>
    </IntegrationForm>
  )
}

const Route = createFileRoute("/issues/new")({
  component: NewIssue,
})

export { Route }
