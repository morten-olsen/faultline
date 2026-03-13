import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useClient } from "../../../../client/client.context.js"
import { IntegrationForm } from "../../../../components/integration-form/integration-form.tsx"
import { FormField } from "../../../../components/form-field/form-field.tsx"
import { Input } from "../../../../components/input/input.tsx"
import { TextArea } from "../../../../components/text-area/text-area.tsx"
import { Select } from "../../../../components/select/select.tsx"
import { AnimatedField } from "../../../../components/animated-field/animated-field.tsx"

const EditSshConnection = (): React.ReactElement => {
  const { id } = Route.useParams()
  const client = useClient()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["sshConnection", id],
    queryFn: () => client.call["sshConnections.get"]({ id }),
  })

  const { data: identitiesData } = useQuery({
    queryKey: ["sshIdentities"],
    queryFn: () => client.call["sshIdentities.list"]({}),
  })

  const connection = data?.connection
  const identities = identitiesData?.identities ?? []

  const [name, setName] = useState("")
  const [host, setHost] = useState("")
  const [port, setPort] = useState("22")
  const [username, setUsername] = useState("")
  const [sshIdentityId, setSshIdentityId] = useState("")
  const [description, setDescription] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (connection && !loaded) {
      setName(connection.name)
      setHost(connection.host)
      setPort(String(connection.port))
      setUsername(connection.username)
      setSshIdentityId(connection.sshIdentityId ?? "")
      setDescription(connection.description ?? "")
      setLoaded(true)
    }
  }, [connection, loaded])

  const updateMutation = useMutation({
    mutationFn: () =>
      client.call["sshConnections.update"]({
        id,
        name,
        host,
        port: parseInt(port, 10),
        username,
        sshIdentityId: sshIdentityId || null,
        description: description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sshConnections"] })
      queryClient.invalidateQueries({ queryKey: ["sshConnection", id] })
      navigate({ to: "/settings/integrations" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => client.call["sshConnections.delete"]({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sshConnections"] })
      navigate({ to: "/settings/integrations" })
    },
  })

  if (!connection) return <div />

  return (
    <IntegrationForm
      title="Edit SSH Connection"
      isEdit
      saving={updateMutation.isPending}
      onBack={() => navigate({ to: "/settings/integrations" })}
      onSave={() => name.trim() && host.trim() && username.trim() && updateMutation.mutate()}
      onDelete={() => deleteMutation.mutate()}
    >
      <AnimatedField index={0}>
        <FormField label="Name">
          <Input value={name} onChange={(v) => setName(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={1}>
        <FormField label="Host">
          <Input value={host} onChange={(v) => setHost(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={2}>
        <FormField label="Port">
          <Input value={port} onChange={(v) => setPort(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={3}>
        <FormField label="Username">
          <Input value={username} onChange={(v) => setUsername(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={4}>
        <FormField label="SSH Identity">
          <Select
            value={sshIdentityId}
            onChange={(v) => setSshIdentityId(v)}
            placeholder="Select an SSH identity…"
            options={identities.map((i) => ({ value: i.id, label: i.name }))}
          />
        </FormField>
      </AnimatedField>

      <AnimatedField index={5}>
        <FormField label="Description">
          <TextArea rows={2} value={description} onChange={(v) => setDescription(v)} />
        </FormField>
      </AnimatedField>
    </IntegrationForm>
  )
}

const Route = createFileRoute("/settings/integrations/ssh-connection/$id/edit")({
  component: EditSshConnection,
})

export { Route }
