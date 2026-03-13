import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { useClient } from "../../../../client/client.context.js"
import { IntegrationForm } from "../../../../components/integration-form/integration-form.tsx"
import { FormField } from "../../../../components/form-field/form-field.tsx"
import { Input } from "../../../../components/input/input.tsx"
import { TextArea } from "../../../../components/text-area/text-area.tsx"
import { AnimatedField } from "../../../../components/animated-field/animated-field.tsx"

const EditArgocd = (): React.ReactElement => {
  const { id } = Route.useParams()
  const client = useClient()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["argoInstance", id],
    queryFn: () => client.call["argoInstances.get"]({ id }),
  })

  const instance = data?.instance

  const [name, setName] = useState("")
  const [serverUrl, setServerUrl] = useState("")
  const [authToken, setAuthToken] = useState("")
  const [description, setDescription] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (instance && !loaded) {
      setName(instance.name)
      setServerUrl(instance.serverUrl)
      setDescription(instance.description ?? "")
      setLoaded(true)
    }
  }, [instance, loaded])

  const updateMutation = useMutation({
    mutationFn: () =>
      client.call["argoInstances.update"]({
        id,
        name,
        serverUrl,
        ...(authToken.trim() ? { authToken } : {}),
        description: description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["argoInstances"] })
      queryClient.invalidateQueries({ queryKey: ["argoInstance", id] })
      navigate({ to: "/settings/integrations" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => client.call["argoInstances.delete"]({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["argoInstances"] })
      navigate({ to: "/settings/integrations" })
    },
  })

  if (!instance) return <div />

  return (
    <IntegrationForm
      title="Edit ArgoCD Instance"
      isEdit
      saving={updateMutation.isPending}
      onBack={() => navigate({ to: "/settings/integrations" })}
      onSave={() => name.trim() && serverUrl.trim() && updateMutation.mutate()}
      onDelete={() => deleteMutation.mutate()}
    >
      <AnimatedField index={0}>
        <FormField label="Name">
          <Input value={name} onChange={(v) => setName(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={1}>
        <FormField label="Server URL">
          <Input value={serverUrl} onChange={(v) => setServerUrl(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={2}>
        <FormField label="Auth token" description="Leave blank to keep the existing token">
          <Input placeholder="Enter new token…" value={authToken} onChange={(v) => setAuthToken(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={3}>
        <FormField label="Description">
          <TextArea rows={2} value={description} onChange={(v) => setDescription(v)} />
        </FormField>
      </AnimatedField>
    </IntegrationForm>
  )
}

const Route = createFileRoute("/settings/integrations/argocd/$id/edit")({
  component: EditArgocd,
})

export { Route }
