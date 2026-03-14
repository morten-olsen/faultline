import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useClient } from '../../../../client/client.context.js';
import { IntegrationForm } from '../../../../components/integration-form/integration-form.tsx';
import { FormField } from '../../../../components/form-field/form-field.tsx';
import { Input } from '../../../../components/input/input.tsx';
import { TextArea } from '../../../../components/text-area/text-area.tsx';
import { Select } from '../../../../components/select/select.tsx';
import { AnimatedField } from '../../../../components/animated-field/animated-field.tsx';

/* ── Sub-components ───────────────────────────────────────────────── */

type IdentityOption = { id: string; name: string };

type NewSshConnectionFieldsProps = {
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

const NewSshConnectionFields = (props: NewSshConnectionFieldsProps): React.ReactElement => (
  <>
    <AnimatedField index={0}>
      <FormField label="Name" description="A friendly name for this host">
        <Input placeholder="nas" value={props.name} onChange={props.onNameChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <FormField label="Host">
        <Input placeholder="10.0.1.50" value={props.host} onChange={props.onHostChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={2}>
      <FormField label="Port">
        <Input value={props.port} onChange={props.onPortChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={3}>
      <FormField label="Username">
        <Input placeholder="admin" value={props.username} onChange={props.onUsernameChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={4}>
      <FormField label="SSH Identity" description="Which key to use when connecting">
        <Select
          value={props.sshIdentityId}
          onChange={props.onSshIdentityIdChange}
          placeholder="Select an SSH identity…"
          options={props.identities.map((i) => ({ value: i.id, label: i.name }))}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={5}>
      <FormField label="Description" description="Helps the agent understand what this host does">
        <TextArea
          placeholder="Synology NAS running ZFS. Hosts backups and home automation data."
          rows={2}
          value={props.description}
          onChange={props.onDescriptionChange}
        />
      </FormField>
    </AnimatedField>
  </>
);

/* ── Page ─────────────────────────────────────────────────────────── */

const NewSshConnection = (): React.ReactElement => {
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [sshIdentityId, setSshIdentityId] = useState('');
  const [description, setDescription] = useState('');

  const { data: identitiesData } = useQuery({
    queryKey: ['sshIdentities'],
    queryFn: () => client.call['sshIdentities.list']({}),
  });

  const identities = identitiesData?.identities ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      client.call['sshConnections.create']({
        name,
        host,
        port: parseInt(port, 10),
        username,
        sshIdentityId: sshIdentityId || null,
        description: description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sshConnections'] });
      navigate({ to: '/settings/integrations' });
    },
  });

  const canSave = name.trim().length > 0 && host.trim().length > 0 && username.trim().length > 0;

  return (
    <IntegrationForm
      title="New SSH Connection"
      saving={mutation.isPending}
      onBack={() => navigate({ to: '/settings/integrations' })}
      onSave={() => canSave && mutation.mutate()}
    >
      <NewSshConnectionFields
        name={name}
        onNameChange={setName}
        host={host}
        onHostChange={setHost}
        port={port}
        onPortChange={setPort}
        username={username}
        onUsernameChange={setUsername}
        sshIdentityId={sshIdentityId}
        onSshIdentityIdChange={setSshIdentityId}
        description={description}
        onDescriptionChange={setDescription}
        identities={identities}
      />
    </IntegrationForm>
  );
};

const Route = createFileRoute('/settings/integrations/ssh-connection/new')({
  component: NewSshConnection,
});

export { Route };
