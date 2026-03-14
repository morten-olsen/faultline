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

type GitRepoFieldsProps = {
  name: string;
  onNameChange: (v: string) => void;
  cloneUrl: string;
  onCloneUrlChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  sshIdentityId: string;
  onSshIdentityIdChange: (v: string) => void;
  defaultBranch: string;
  onDefaultBranchChange: (v: string) => void;
  identities: IdentityOption[];
};

const GitRepoFields = (props: GitRepoFieldsProps): React.ReactElement => (
  <>
    <AnimatedField index={0}>
      <FormField label="Name">
        <Input value={props.name} onChange={props.onNameChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <FormField label="Clone URL">
        <Input value={props.cloneUrl} onChange={props.onCloneUrlChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={2}>
      <FormField label="Description">
        <TextArea rows={3} value={props.description} onChange={props.onDescriptionChange} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={3}>
      <FormField label="SSH Identity">
        <Select
          value={props.sshIdentityId}
          onChange={props.onSshIdentityIdChange}
          placeholder="Select an SSH identity…"
          options={props.identities.map((i) => ({ value: i.id, label: i.name }))}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={4}>
      <FormField label="Default branch">
        <Input value={props.defaultBranch} onChange={props.onDefaultBranchChange} />
      </FormField>
    </AnimatedField>
  </>
);

/* ── Hook ─────────────────────────────────────────────────────────── */

const useEditGitRepoForm = (id: string) => {
  const client = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ['gitRepo', id], queryFn: () => client.call['gitRepos.get']({ id }) });
  const { data: identitiesData } = useQuery({
    queryKey: ['sshIdentities'],
    queryFn: () => client.call['sshIdentities.list']({}),
  });

  const repo = data?.repo;
  const identities = identitiesData?.identities ?? [];

  const [name, setName] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const [description, setDescription] = useState('');
  const [sshIdentityId, setSshIdentityId] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (repo && !loaded) {
      setName(repo.name);
      setCloneUrl(repo.cloneUrl);
      setDescription(repo.description ?? '');
      setSshIdentityId(repo.sshIdentityId ?? '');
      setDefaultBranch(repo.defaultBranch);
      setLoaded(true);
    }
  }, [repo, loaded]);

  const updateMutation = useMutation({
    mutationFn: () =>
      client.call['gitRepos.update']({
        id,
        name,
        cloneUrl,
        description: description || null,
        sshIdentityId: sshIdentityId || null,
        defaultBranch,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gitRepos'] });
      queryClient.invalidateQueries({ queryKey: ['gitRepo', id] });
      navigate({ to: '/settings/integrations' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.call['gitRepos.delete']({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gitRepos'] });
      navigate({ to: '/settings/integrations' });
    },
  });

  return {
    repo,
    identities,
    name,
    setName,
    cloneUrl,
    setCloneUrl,
    description,
    setDescription,
    sshIdentityId,
    setSshIdentityId,
    defaultBranch,
    setDefaultBranch,
    updateMutation,
    deleteMutation,
    navigate,
  };
};

/* ── Page ─────────────────────────────────────────────────────────── */

const EditGitRepo = (): React.ReactElement => {
  const { id } = Route.useParams();
  const form = useEditGitRepoForm(id);

  if (!form.repo) {
    return <div />;
  }

  return (
    <IntegrationForm
      title="Edit Git Repository"
      isEdit
      saving={form.updateMutation.isPending}
      onBack={() => form.navigate({ to: '/settings/integrations' })}
      onSave={() => form.name.trim() && form.cloneUrl.trim() && form.updateMutation.mutate()}
      onDelete={() => form.deleteMutation.mutate()}
    >
      <GitRepoFields
        name={form.name}
        onNameChange={form.setName}
        cloneUrl={form.cloneUrl}
        onCloneUrlChange={form.setCloneUrl}
        description={form.description}
        onDescriptionChange={form.setDescription}
        sshIdentityId={form.sshIdentityId}
        onSshIdentityIdChange={form.setSshIdentityId}
        defaultBranch={form.defaultBranch}
        onDefaultBranchChange={form.setDefaultBranch}
        identities={form.identities}
      />
    </IntegrationForm>
  );
};

const Route = createFileRoute('/settings/integrations/git-repo/$id/edit')({
  component: EditGitRepo,
});

export { Route };
