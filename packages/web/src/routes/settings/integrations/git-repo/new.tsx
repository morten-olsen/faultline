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

const NewGitRepo = (): React.ReactElement => {
  const client = useClient()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [cloneUrl, setCloneUrl] = useState("")
  const [description, setDescription] = useState("")
  const [sshIdentityId, setSshIdentityId] = useState("")
  const [defaultBranch, setDefaultBranch] = useState("main")

  const { data: identitiesData } = useQuery({
    queryKey: ["sshIdentities"],
    queryFn: () => client.call["sshIdentities.list"]({}),
  })

  const identities = identitiesData?.identities ?? []

  const mutation = useMutation({
    mutationFn: () =>
      client.call["gitRepos.create"]({
        name,
        cloneUrl,
        description: description || null,
        sshIdentityId: sshIdentityId || null,
        defaultBranch,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gitRepos"] })
      navigate({ to: "/settings/integrations" })
    },
  })

  const canSave = name.trim().length > 0 && cloneUrl.trim().length > 0

  return (
    <IntegrationForm
      title="New Git Repository"
      saving={mutation.isPending}
      onBack={() => navigate({ to: "/settings/integrations" })}
      onSave={() => canSave && mutation.mutate()}
    >
      <AnimatedField index={0}>
        <FormField label="Name" description="A short name for this repo">
          <Input placeholder="infra-gitops" value={name} onChange={(v) => setName(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={1}>
        <FormField label="Clone URL" description="The SSH address the agent uses to fetch and push">
          <Input placeholder="git@github.com:acme/infra-gitops.git" value={cloneUrl} onChange={(v) => setCloneUrl(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={2}>
        <FormField label="Description" description="Helps the agent understand what this repo is for">
          <TextArea
            placeholder="Kubernetes manifests for the homelab cluster."
            rows={3}
            value={description}
            onChange={(v) => setDescription(v)}
          />
        </FormField>
      </AnimatedField>

      <AnimatedField index={3}>
        <FormField label="SSH Identity" description="Which key to use when talking to this remote">
          <Select
            value={sshIdentityId}
            onChange={(v) => setSshIdentityId(v)}
            placeholder="Select an SSH identity…"
            options={identities.map((i) => ({ value: i.id, label: i.name }))}
          />
        </FormField>
      </AnimatedField>

      <AnimatedField index={4}>
        <FormField label="Default branch">
          <Input value={defaultBranch} onChange={(v) => setDefaultBranch(v)} />
        </FormField>
      </AnimatedField>
    </IntegrationForm>
  )
}

const Route = createFileRoute("/settings/integrations/git-repo/new")({
  component: NewGitRepo,
})

export { Route }
