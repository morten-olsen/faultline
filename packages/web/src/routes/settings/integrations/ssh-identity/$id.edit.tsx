import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { useClient } from "../../../../client/client.context.js"
import { IntegrationForm } from "../../../../components/integration-form/integration-form.tsx"
import { FormField } from "../../../../components/form-field/form-field.tsx"
import { Input } from "../../../../components/input/input.tsx"
import { CopyBlock } from "../../../../components/copy-block/copy-block.tsx"
import { AnimatedField } from "../../../../components/animated-field/animated-field.tsx"

const EditSshIdentity = (): React.ReactElement => {
  const { id } = Route.useParams()
  const client = useClient()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ["sshIdentity", id],
    queryFn: () => client.call["sshIdentities.get"]({ id }),
  })

  const identity = data?.identity

  const [name, setName] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (identity && !loaded) {
      setName(identity.name)
      setLoaded(true)
    }
  }, [identity, loaded])

  const updateMutation = useMutation({
    mutationFn: () =>
      client.call["sshIdentities.update"]({ id, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sshIdentities"] })
      queryClient.invalidateQueries({ queryKey: ["sshIdentity", id] })
      navigate({ to: "/settings/integrations" })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => client.call["sshIdentities.delete"]({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sshIdentities"] })
      navigate({ to: "/settings/integrations" })
    },
  })

  if (!identity) return <div />

  return (
    <IntegrationForm
      title="Edit SSH Identity"
      isEdit
      saving={updateMutation.isPending}
      onBack={() => navigate({ to: "/settings/integrations" })}
      onSave={() => name.trim() && updateMutation.mutate()}
      onDelete={() => deleteMutation.mutate()}
    >
      <AnimatedField index={0}>
        <FormField label="Name">
          <Input value={name} onChange={(v) => setName(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={1}>
        <CopyBlock
          label="Public key"
          value={identity.publicKey}
          onCopy={() => navigator.clipboard.writeText(identity.publicKey)}
        />
      </AnimatedField>

      <AnimatedField index={2}>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Check size={14} className="text-green-400" />
          <span>
            Private key stored on server · {identity.keyType} · created{" "}
            {new Date(identity.createdAt).toLocaleDateString()}
          </span>
        </div>
      </AnimatedField>
    </IntegrationForm>
  )
}

const Route = createFileRoute("/settings/integrations/ssh-identity/$id/edit")({
  component: EditSshIdentity,
})

export { Route }
