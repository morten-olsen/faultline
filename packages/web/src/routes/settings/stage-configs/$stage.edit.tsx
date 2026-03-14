import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { useClient } from '../../../client/client.context.js';
import { IntegrationForm } from '../../../components/integration-form/integration-form.tsx';
import { FormField } from '../../../components/form-field/form-field.tsx';
import { TextArea } from '../../../components/text-area/text-area.tsx';
import { Select } from '../../../components/select/select.tsx';
import { AnimatedField } from '../../../components/animated-field/animated-field.tsx';
import { AllowanceField } from '../../../components/allowance-field/allowance-field.tsx';
import { stageDisplay } from '../../../components/stage-config-list/stage-config-list.tsx';
import type { AllowanceMode, AllowanceOption } from '../../../components/allowance-field/allowance-field.tsx';
import type { StageName } from '../../../components/stage-config-list/stage-config-list.tsx';

/* ── Helpers ──────────────────────────────────────────────────────── */

const toMode = (arr: string[] | null): AllowanceMode => {
  if (arr === null) {
    return 'all';
  }
  if (arr.length === 0) {
    return 'none';
  }
  return 'select';
};

const fromMode = (mode: AllowanceMode, selected: string[]): string[] | null => {
  if (mode === 'all') {
    return null;
  }
  if (mode === 'none') {
    return [];
  }
  return selected;
};

/* ── Sub-components ───────────────────────────────────────────────── */

type AllowanceSectionProps = {
  kubeMode: AllowanceMode;
  kubeSelected: string[];
  kubeOptions: AllowanceOption[];
  onKubeModeChange: (m: AllowanceMode) => void;
  onKubeAdd: (v: string) => void;
  onKubeRemove: (v: string) => void;
  sshConnMode: AllowanceMode;
  sshConnSelected: string[];
  sshConnOptions: AllowanceOption[];
  onSshConnModeChange: (m: AllowanceMode) => void;
  onSshConnAdd: (v: string) => void;
  onSshConnRemove: (v: string) => void;
};

const AllowanceKubeAndSsh = (props: AllowanceSectionProps): React.ReactElement => (
  <>
    <AnimatedField index={0}>
      <AllowanceField
        label="Kubernetes contexts"
        description="Which clusters the agent can access at this stage"
        mode={props.kubeMode}
        selected={props.kubeSelected}
        options={props.kubeOptions}
        onModeChange={props.onKubeModeChange}
        onAdd={props.onKubeAdd}
        onRemove={props.onKubeRemove}
      />
    </AnimatedField>

    <AnimatedField index={1}>
      <AllowanceField
        label="SSH connections"
        description="Which hosts the agent can SSH into"
        mode={props.sshConnMode}
        selected={props.sshConnSelected}
        options={props.sshConnOptions}
        onModeChange={props.onSshConnModeChange}
        onAdd={props.onSshConnAdd}
        onRemove={props.onSshConnRemove}
      />
    </AnimatedField>
  </>
);

type AllowanceGitAndArgoProps = {
  gitMode: AllowanceMode;
  gitSelected: string[];
  gitOptions: AllowanceOption[];
  onGitModeChange: (m: AllowanceMode) => void;
  onGitAdd: (v: string) => void;
  onGitRemove: (v: string) => void;
  argoMode: AllowanceMode;
  argoSelected: string[];
  argoOptions: AllowanceOption[];
  onArgoModeChange: (m: AllowanceMode) => void;
  onArgoAdd: (v: string) => void;
  onArgoRemove: (v: string) => void;
};

const AllowanceGitAndArgo = (props: AllowanceGitAndArgoProps): React.ReactElement => (
  <>
    <AnimatedField index={2}>
      <AllowanceField
        label="Git repositories"
        description="Which repos the agent can clone"
        mode={props.gitMode}
        selected={props.gitSelected}
        options={props.gitOptions}
        onModeChange={props.onGitModeChange}
        onAdd={props.onGitAdd}
        onRemove={props.onGitRemove}
      />
    </AnimatedField>

    <AnimatedField index={3}>
      <AllowanceField
        label="ArgoCD instances"
        description="Which ArgoCD instances the agent can query"
        mode={props.argoMode}
        selected={props.argoSelected}
        options={props.argoOptions}
        onModeChange={props.onArgoModeChange}
        onAdd={props.onArgoAdd}
        onRemove={props.onArgoRemove}
      />
    </AnimatedField>
  </>
);

type BottomFieldsProps = {
  sshIdentityId: string;
  onSshIdentityIdChange: (v: string) => void;
  identityOptions: AllowanceOption[];
  additionalPrompt: string;
  onAdditionalPromptChange: (v: string) => void;
};

const BottomFields = (props: BottomFieldsProps): React.ReactElement => (
  <>
    <AnimatedField index={4}>
      <FormField
        label="Fallback SSH identity"
        description="Used when an SSH connection doesn't have its own identity set"
      >
        <Select
          value={props.sshIdentityId}
          onChange={props.onSshIdentityIdChange}
          placeholder="None"
          options={props.identityOptions}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={5}>
      <FormField
        label="Additional system prompt"
        description="Appended to the agent's system prompt when working on issues at this stage"
      >
        <TextArea
          value={props.additionalPrompt}
          onChange={props.onAdditionalPromptChange}
          placeholder="Any additional instructions for the agent at this stage…"
          rows={3}
        />
      </FormField>
    </AnimatedField>
  </>
);

/* ── Hook: form state + data fetching ─────────────────────────────── */

type AllowanceState = {
  mode: AllowanceMode;
  selected: string[];
  setMode: (m: AllowanceMode) => void;
  add: (v: string) => void;
  remove: (v: string) => void;
};

const useAllowanceState = (initial: AllowanceMode = 'all'): AllowanceState => {
  const [mode, setModeRaw] = useState<AllowanceMode>(initial);
  const [selected, setSelected] = useState<string[]>([]);

  const setMode = (m: AllowanceMode): void => {
    setModeRaw(m);
    if (m !== 'select') {
      setSelected([]);
    }
  };

  const add = (v: string): void => setSelected((prev) => [...prev, v]);
  const remove = (v: string): void => setSelected((prev) => prev.filter((id) => id !== v));

  return { mode, selected, setMode, add, remove };
};

const useStageConfigData = (stage: string) => {
  const client = useClient();

  const { data: configData } = useQuery({
    queryKey: ['stageConfig', stage],
    queryFn: () => client.call['stageConfigs.get']({ stage }),
  });
  const { data: kubeData } = useQuery({
    queryKey: ['kubeContexts'],
    queryFn: () => client.call['kubeContexts.list']({}),
  });
  const { data: sshConnData } = useQuery({
    queryKey: ['sshConnections'],
    queryFn: () => client.call['sshConnections.list']({}),
  });
  const { data: gitData } = useQuery({ queryKey: ['gitRepos'], queryFn: () => client.call['gitRepos.list']({}) });
  const { data: argoData } = useQuery({
    queryKey: ['argoInstances'],
    queryFn: () => client.call['argoInstances.list']({}),
  });
  const { data: identitiesData } = useQuery({
    queryKey: ['sshIdentities'],
    queryFn: () => client.call['sshIdentities.list']({}),
  });

  const config = configData?.config ?? null;
  const stageLabel = stageDisplay[stage as StageName]?.label ?? stage;

  const kubeOptions: AllowanceOption[] = (kubeData?.contexts ?? []).map((c) => ({ value: c.id, label: c.name }));
  const sshConnOptions: AllowanceOption[] = (sshConnData?.connections ?? []).map((c) => ({
    value: c.id,
    label: `${c.name} (${c.username}@${c.host})`,
  }));
  const gitOptions: AllowanceOption[] = (gitData?.repos ?? []).map((r) => ({ value: r.id, label: r.name }));
  const argoOptions: AllowanceOption[] = (argoData?.instances ?? []).map((i) => ({ value: i.id, label: i.name }));
  const identityOptions = (identitiesData?.identities ?? []).map((i) => ({ value: i.id, label: i.name }));

  return { configData, config, stageLabel, kubeOptions, sshConnOptions, gitOptions, argoOptions, identityOptions };
};

const useStageConfigForm = (stage: string) => {
  const navigate = useNavigate();
  const client = useClient();
  const queryClient = useQueryClient();
  const data = useStageConfigData(stage);

  const kube = useAllowanceState();
  const sshConn = useAllowanceState();
  const git = useAllowanceState();
  const argo = useAllowanceState();
  const [sshIdentityId, setSshIdentityId] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (data.configData && !loaded) {
      if (data.config) {
        kube.setMode(toMode(data.config.allowedKubeContexts));
        sshConn.setMode(toMode(data.config.allowedSshConnections));
        git.setMode(toMode(data.config.allowedGitRepos));
        argo.setMode(toMode(data.config.allowedArgocdInstances));
        setSshIdentityId(data.config.sshIdentityId ?? '');
        setAdditionalPrompt(data.config.additionalSystemPrompt ?? '');
      }
      setLoaded(true);
    }
  }, [data.configData, data.config, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const upsertMutation = useMutation({
    mutationFn: () =>
      client.call['stageConfigs.upsert']({
        stage,
        allowedKubeContexts: fromMode(kube.mode, kube.selected),
        allowedSshConnections: fromMode(sshConn.mode, sshConn.selected),
        allowedGitRepos: fromMode(git.mode, git.selected),
        allowedArgocdInstances: fromMode(argo.mode, argo.selected),
        sshIdentityId: sshIdentityId || null,
        additionalSystemPrompt: additionalPrompt || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stageConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['stageConfig', stage] });
      navigate({ to: '/settings/stage-configs' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.call['stageConfigs.delete']({ stage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stageConfigs'] });
      navigate({ to: '/settings/stage-configs' });
    },
  });

  return {
    ...data,
    isEdit: data.config !== null,
    kube,
    sshConn,
    git,
    argo,
    sshIdentityId,
    setSshIdentityId,
    additionalPrompt,
    setAdditionalPrompt,
    upsertMutation,
    deleteMutation,
    navigate,
  };
};

/* ── Page ─────────────────────────────────────────────────────────── */

const EditStageConfig = (): React.ReactElement => {
  const { stage } = Route.useParams();
  const form = useStageConfigForm(stage);

  if (!form.configData) {
    return <div />;
  }

  return (
    <IntegrationForm
      title={`${form.stageLabel} — Stage Config`}
      isEdit={form.isEdit}
      saving={form.upsertMutation.isPending}
      onBack={() => form.navigate({ to: '/settings/stage-configs' })}
      onSave={() => form.upsertMutation.mutate()}
      onDelete={form.isEdit ? () => form.deleteMutation.mutate() : undefined}
    >
      <AllowanceKubeAndSsh
        kubeMode={form.kube.mode}
        kubeSelected={form.kube.selected}
        kubeOptions={form.kubeOptions}
        onKubeModeChange={form.kube.setMode}
        onKubeAdd={form.kube.add}
        onKubeRemove={form.kube.remove}
        sshConnMode={form.sshConn.mode}
        sshConnSelected={form.sshConn.selected}
        sshConnOptions={form.sshConnOptions}
        onSshConnModeChange={form.sshConn.setMode}
        onSshConnAdd={form.sshConn.add}
        onSshConnRemove={form.sshConn.remove}
      />
      <AllowanceGitAndArgo
        gitMode={form.git.mode}
        gitSelected={form.git.selected}
        gitOptions={form.gitOptions}
        onGitModeChange={form.git.setMode}
        onGitAdd={form.git.add}
        onGitRemove={form.git.remove}
        argoMode={form.argo.mode}
        argoSelected={form.argo.selected}
        argoOptions={form.argoOptions}
        onArgoModeChange={form.argo.setMode}
        onArgoAdd={form.argo.add}
        onArgoRemove={form.argo.remove}
      />
      <BottomFields
        sshIdentityId={form.sshIdentityId}
        onSshIdentityIdChange={form.setSshIdentityId}
        identityOptions={form.identityOptions}
        additionalPrompt={form.additionalPrompt}
        onAdditionalPromptChange={form.setAdditionalPrompt}
      />
    </IntegrationForm>
  );
};

/* ── Route ────────────────────────────────────────────────────────── */

const Route = createFileRoute('/settings/stage-configs/$stage/edit')({
  component: EditStageConfig,
});

export { Route };
