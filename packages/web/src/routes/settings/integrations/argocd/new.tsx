import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useClient } from '../../../../client/client.context.js';
import { IntegrationForm } from '../../../../components/integration-form/integration-form.tsx';
import { FormField } from '../../../../components/form-field/form-field.tsx';
import { Input } from '../../../../components/input/input.tsx';
import { TextArea } from '../../../../components/text-area/text-area.tsx';
import { AnimatedField } from '../../../../components/animated-field/animated-field.tsx';

const NewArgocd = (): React.ReactElement => {
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      client.call['argoInstances.create']({
        name,
        serverUrl,
        authToken,
        description: description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['argoInstances'] });
      navigate({ to: '/settings/integrations' });
    },
  });

  const canSave = name.trim().length > 0 && serverUrl.trim().length > 0 && authToken.trim().length > 0;

  return (
    <IntegrationForm
      title="New ArgoCD Instance"
      saving={mutation.isPending}
      onBack={() => navigate({ to: '/settings/integrations' })}
      onSave={() => canSave && mutation.mutate()}
    >
      <AnimatedField index={0}>
        <FormField label="Name" description="A friendly name for this instance">
          <Input placeholder="homelab-argo" value={name} onChange={(v) => setName(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={1}>
        <FormField label="Server URL">
          <Input placeholder="https://argocd.homelab.local" value={serverUrl} onChange={(v) => setServerUrl(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={2}>
        <FormField label="Auth token" description="An API token for the agent. Stored on the server, never sent back.">
          <Input placeholder="eyJhbGciOiJIUzI1NiIs…" value={authToken} onChange={(v) => setAuthToken(v)} />
        </FormField>
      </AnimatedField>

      <AnimatedField index={3}>
        <FormField label="Description">
          <TextArea
            placeholder="Manages all homelab deployments. Watches the infra-gitops repo."
            rows={2}
            value={description}
            onChange={(v) => setDescription(v)}
          />
        </FormField>
      </AnimatedField>
    </IntegrationForm>
  );
};

const Route = createFileRoute('/settings/integrations/argocd/new')({
  component: NewArgocd,
});

export { Route };
