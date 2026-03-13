import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useClient } from "../../../../client/client.context.js"
import { IntegrationForm } from "../../../../components/integration-form/integration-form.tsx"
import { FormField } from "../../../../components/form-field/form-field.tsx"
import { Input } from "../../../../components/input/input.tsx"
import { TextArea } from "../../../../components/text-area/text-area.tsx"
import { Select } from "../../../../components/select/select.tsx"
import { AnimatedField } from "../../../../components/animated-field/animated-field.tsx"

const NewKubernetes = (): React.ReactElement => {
  const client = useClient()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [context, setContext] = useState("")
  const [description, setDescription] = useState("")

  const { data: availableData } = useQuery({
    queryKey: ["kubeContextsAvailable"],
    queryFn: () => client.call["kubeContexts.available"]({}),
  })

  const availableContexts = availableData?.contexts ?? []

  const mutation = useMutation({
    mutationFn: () =>
      client.call["kubeContexts.create"]({
        name,
        context,
        description: description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kubeContexts"] })
      navigate({ to: "/settings/integrations" })
    },
  })

  const canSave = name.trim().length > 0 && context.trim().length > 0

  return (
    <IntegrationForm
      title="New Kubernetes Context"
      saving={mutation.isPending}
      onBack={() => navigate({ to: "/settings/integrations" })}
      onSave={() => canSave && mutation.mutate()}
    >
      <AnimatedField index={0}>
        <FormField label="Name" description="A friendly name for this cluster">
          <Input placeholder="homelab-prod" value={name} onChange={(v) => setName(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={1}>
        <FormField label="Kube context" description="The context from the server's kubeconfig to use">
          <Select
            value={context}
            onChange={(v) => setContext(v)}
            placeholder="Select a context…"
            options={availableContexts.map((c) => ({ value: c, label: c }))}
          />
        </FormField>
      </AnimatedField>

      <AnimatedField index={2}>
        <FormField label="Description" description="Helps the agent understand this cluster's role">
          <TextArea
            placeholder="Production homelab cluster running Traefik and ArgoCD."
            rows={2}
            value={description}
            onChange={(v) => setDescription(v)}
          />
        </FormField>
      </AnimatedField>
    </IntegrationForm>
  )
}

const Route = createFileRoute("/settings/integrations/kubernetes/new")({
  component: NewKubernetes,
})

export { Route }
