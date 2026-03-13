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

const NewSshConnection = (): React.ReactElement => {
  const client = useClient()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [host, setHost] = useState("")
  const [port, setPort] = useState("22")
  const [username, setUsername] = useState("")
  const [sshIdentityId, setSshIdentityId] = useState("")
  const [description, setDescription] = useState("")

  const { data: identitiesData } = useQuery({
    queryKey: ["sshIdentities"],
    queryFn: () => client.call["sshIdentities.list"]({}),
  })

  const identities = identitiesData?.identities ?? []

  const mutation = useMutation({
    mutationFn: () =>
      client.call["sshConnections.create"]({
        name,
        host,
        port: parseInt(port, 10),
        username,
        sshIdentityId: sshIdentityId || null,
        description: description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sshConnections"] })
      navigate({ to: "/settings/integrations" })
    },
  })

  const canSave = name.trim().length > 0 && host.trim().length > 0 && username.trim().length > 0

  return (
    <IntegrationForm
      title="New SSH Connection"
      saving={mutation.isPending}
      onBack={() => navigate({ to: "/settings/integrations" })}
      onSave={() => canSave && mutation.mutate()}
    >
      <AnimatedField index={0}>
        <FormField label="Name" description="A friendly name for this host">
          <Input placeholder="nas" value={name} onChange={(v) => setName(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={1}>
        <FormField label="Host">
          <Input placeholder="10.0.1.50" value={host} onChange={(v) => setHost(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={2}>
        <FormField label="Port">
          <Input value={port} onChange={(v) => setPort(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={3}>
        <FormField label="Username">
          <Input placeholder="admin" value={username} onChange={(v) => setUsername(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={4}>
        <FormField label="SSH Identity" description="Which key to use when connecting">
          <Select
            value={sshIdentityId}
            onChange={(v) => setSshIdentityId(v)}
            placeholder="Select an SSH identity…"
            options={identities.map((i) => ({ value: i.id, label: i.name }))}
          />
        </FormField>
      </AnimatedField>

      <AnimatedField index={5}>
        <FormField label="Description" description="Helps the agent understand what this host does">
          <TextArea
            placeholder="Synology NAS running ZFS. Hosts backups and home automation data."
            rows={2}
            value={description}
            onChange={(v) => setDescription(v)}
          />
        </FormField>
      </AnimatedField>
    </IntegrationForm>
  )
}

const Route = createFileRoute("/settings/integrations/ssh-connection/new")({
  component: NewSshConnection,
})

export { Route }
