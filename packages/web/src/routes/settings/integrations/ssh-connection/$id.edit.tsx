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

type IdentityOption = { id: string; name: string };

type SshConnectionFieldsProps = {
  name: string;
  onNameChange: (v: string) => void;
  host: string;
  onHostChange: (v: string) => void;
  port: string;
  onPortChange: (v: string) => void;
  username: string;
  onUsernameChange: (v: string) => void;
  sshIdentityId: string;
  onSshIdentityIdChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  identities: IdentityOption[];
};

const SshConnectionFields = (props: SshConnectionFieldsProps): React.ReactElement => (
  <>
    <AnimatedField index={0}>
      <FormField label="Name">
        <Input value={props.name} onChange={props.onNameChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <FormField label="Host">
        <Input value={props.host} onChange={props.onHostChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={2}>
      <FormField label="Port">
        <Input value={props.port} onChange={props.onPortChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={3}>
      <FormField label="Username">
        <Input value={props.username} onChange={props.onUsernameChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={4}>
      <FormField label="SSH Identity">
        <Select
          value={props.sshIdentityId}
          onChange={props.onSshIdentityIdChange}
          placeholder="Select an SSH identity…"
          options={props.identities.map((i) => ({ value: i.id, label: i.name }))}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={5}>
      <FormField label="Description">
        <TextArea rows={2} value={props.description} onChange={props.onDescriptionChange} />
      </FormField>
    </AnimatedField>
  </>
);

/* ── Hook ─────────────────────────────────────────────────────────── */

const useEditSshConnectionForm = (id: string) => {
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['sshConnection', id],
    queryFn: () => client.call['sshConnections.get']({ id }),
  });
  const { data: identitiesData } = useQuery({
    queryKey: ['sshIdentities'],
    queryFn: () => client.call['sshIdentities.list']({}),
  });

  const connection = data?.connection;
  const identities = identitiesData?.identities ?? [];

  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [sshIdentityId, setSshIdentityId] = useState('');
  const [description, setDescription] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (connection && !loaded) {
      setName(connection.name);
      setHost(connection.host);
      setPort(String(connection.port));
      setUsername(connection.username);
      setSshIdentityId(connection.sshIdentityId ?? '');
      setDescription(connection.description ?? '');
      setLoaded(true);
    }
  }, [connection, loaded]);

  const updateMutation = useMutation({
    mutationFn: () =>
      client.call['sshConnections.update']({
        id,
        name,
        host,
        port: parseInt(port, 10),
        username,
        sshIdentityId: sshIdentityId || null,
        description: description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sshConnections'] });
      queryClient.invalidateQueries({ queryKey: ['sshConnection', id] });
      navigate({ to: '/settings/integrations' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.call['sshConnections.delete']({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sshConnections'] });
      navigate({ to: '/settings/integrations' });
    },
  });

  return {
    connection,
    identities,
    name,
    setName,
    host,
    setHost,
    port,
    setPort,
    username,
    setUsername,
    sshIdentityId,
    setSshIdentityId,
    description,
    setDescription,
    updateMutation,
    deleteMutation,
    navigate,
  };
};

/* ── Page ─────────────────────────────────────────────────────────── */

const EditSshConnection = (): React.ReactElement => {
  const { id } = Route.useParams();
  const form = useEditSshConnectionForm(id);

  if (!form.connection) {
    return <div />;
  }

  return (
    <IntegrationForm
      title="Edit SSH Connection"
      isEdit
      saving={form.updateMutation.isPending}
      onBack={() => form.navigate({ to: '/settings/integrations' })}
      onSave={() => form.name.trim() && form.host.trim() && form.username.trim() && form.updateMutation.mutate()}
      onDelete={() => form.deleteMutation.mutate()}
    >
      <SshConnectionFields
        name={form.name}
        onNameChange={form.setName}
        host={form.host}
        onHostChange={form.setHost}
        port={form.port}
        onPortChange={form.setPort}
        username={form.username}
        onUsernameChange={form.setUsername}
        sshIdentityId={form.sshIdentityId}
        onSshIdentityIdChange={form.setSshIdentityId}
        description={form.description}
        onDescriptionChange={form.setDescription}
        identities={form.identities}
      />
    </IntegrationForm>
  );
};

const Route = createFileRoute('/settings/integrations/ssh-connection/$id/edit')({
  component: EditSshConnection,
});

export { Route };
