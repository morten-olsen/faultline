import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { useClient } from '../../../../client/client.context.js';
import { IntegrationForm } from '../../../../components/integration-form/integration-form.tsx';
import { FormField } from '../../../../components/form-field/form-field.tsx';
import { Input } from '../../../../components/input/input.tsx';
import { TextArea } from '../../../../components/text-area/text-area.tsx';
import { Select } from '../../../../components/select/select.tsx';
import { AnimatedField } from '../../../../components/animated-field/animated-field.tsx';

/* ── Sub-components ───────────────────────────────────────────────── */

type KubeFieldsProps = {
  name: string;
  onNameChange: (v: string) => void;
  context: string;
  onContextChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  availableContexts: string[];
};

const KubeFields = (props: KubeFieldsProps): React.ReactElement => (
  <>
    <AnimatedField index={0}>
      <FormField label="Name">
        <Input value={props.name} onChange={props.onNameChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <FormField label="Kube context">
        <Select
          value={props.context}
          onChange={props.onContextChange}
          placeholder="Select a context…"
          options={props.availableContexts.map((c) => ({ value: c, label: c }))}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={2}>
      <FormField label="Description">
        <TextArea rows={2} value={props.description} onChange={props.onDescriptionChange} />
      </FormField>
    </AnimatedField>
  </>
);

/* ── Page ─────────────────────────────────────────────────────────── */

const EditKubernetes = (): React.ReactElement => {
  const { id } = Route.useParams();
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['kubeContext', id],
    queryFn: () => client.call['kubeContexts.get']({ id }),
  });

  const { data: availableData } = useQuery({
    queryKey: ['kubeContextsAvailable'],
    queryFn: () => client.call['kubeContexts.available']({}),
  });

  const kubeContext = data?.context;
  const availableContexts = availableData?.contexts ?? [];

  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [description, setDescription] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (kubeContext && !loaded) {
      setName(kubeContext.name);
      setContext(kubeContext.context);
      setDescription(kubeContext.description ?? '');
      setLoaded(true);
    }
  }, [kubeContext, loaded]);

  const updateMutation = useMutation({
    mutationFn: () =>
      client.call['kubeContexts.update']({
        id,
        name,
        context,
        description: description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kubeContexts'] });
      queryClient.invalidateQueries({ queryKey: ['kubeContext', id] });
      navigate({ to: '/settings/integrations' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.call['kubeContexts.delete']({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kubeContexts'] });
      navigate({ to: '/settings/integrations' });
    },
  });

  if (!kubeContext) {
    return <div />;
  }

  return (
    <IntegrationForm
      title="Edit Kubernetes Context"
      isEdit
      saving={updateMutation.isPending}
      onBack={() => navigate({ to: '/settings/integrations' })}
      onSave={() => name.trim() && context.trim() && updateMutation.mutate()}
      onDelete={() => deleteMutation.mutate()}
    >
      <KubeFields
        name={name}
        onNameChange={setName}
        context={context}
        onContextChange={setContext}
        description={description}
        onDescriptionChange={setDescription}
        availableContexts={availableContexts}
      />
    </IntegrationForm>
  );
};

const Route = createFileRoute('/settings/integrations/kubernetes/$id/edit')({
  component: EditKubernetes,
});

export { Route };
