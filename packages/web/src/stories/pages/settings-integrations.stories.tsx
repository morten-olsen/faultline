import type { Meta, StoryObj } from '@storybook/react-vite';
import { motion } from 'motion/react';
import { Server, Check, Shield } from 'lucide-react';

import { SettingsShell } from '../../components/settings-shell/settings-shell.tsx';
import { IntegrationForm } from '../../components/integration-form/integration-form.tsx';
import { FormField } from '../../components/form-field/form-field.tsx';
import { Input } from '../../components/input/input.tsx';
import { TextArea } from '../../components/text-area/text-area.tsx';
import { Select } from '../../components/select/select.tsx';
import { Button } from '../../components/button/button.tsx';
import { ToggleGroup } from '../../components/toggle-group/toggle-group.tsx';
import { CopyBlock } from '../../components/copy-block/copy-block.tsx';
import { AnimatedField } from '../../components/animated-field/animated-field.tsx';
import {
  SectionHeader,
  IntegrationRow,
  integrationTypes,
} from '../../components/integration-list/integration-list.tsx';
import type { IntegrationType, IntegrationItem } from '../../components/integration-list/integration-list.tsx';

/*
 * Settings — Integrations
 *
 * The agent's toolbox. Each integration gives the agent access
 * to a system it can use during issue resolution: SSH keys for
 * authentication, git repos for gitops changes, kube contexts
 * for cluster access, ArgoCD for deployment pipelines, and SSH
 * connections for remote execution.
 *
 * Integrations are optional — the agent works with whatever is
 * configured. Stage-based access control (which identities and
 * tools are available at each stage) is handled separately —
 * this screen is purely about connecting to external systems.
 *
 * The design follows "configuration without sprawl" — each
 * integration is a focused form with only the fields that matter.
 * No tabs within tabs, no nested modals. Add, edit, done.
 */

/* ── Animation presets ────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
};

/* ── Mock data ────────────────────────────────────────────────────── */

const mockIntegrations: IntegrationItem[] = [
  {
    id: 'ssh-1',
    type: 'ssh-identity',
    name: 'deploy-readonly',
    detail: 'ed25519 · created 2 weeks ago',
  },
  {
    id: 'ssh-2',
    type: 'ssh-identity',
    name: 'deploy-write',
    detail: 'ed25519 · created 1 week ago',
  },
  {
    id: 'git-1',
    type: 'git-repo',
    name: 'infra-gitops',
    detail: 'git@github.com:acme/infra-gitops.git',
    tags: [{ label: 'deploy-write', variant: 'default' }],
  },
  {
    id: 'git-2',
    type: 'git-repo',
    name: 'k8s-manifests',
    detail: 'git@github.com:acme/k8s-manifests.git',
    tags: [{ label: 'deploy-readonly', variant: 'default' }],
  },
  {
    id: 'k8s-1',
    type: 'kubernetes',
    name: 'homelab-prod',
    detail: 'context: homelab-prod',
  },
  {
    id: 'argo-1',
    type: 'argocd',
    name: 'homelab-argo',
    detail: 'https://argocd.homelab.local',
  },
  {
    id: 'ssh-conn-1',
    type: 'ssh-connection',
    name: 'nas',
    detail: 'admin@10.0.1.50:22',
    tags: [{ label: 'deploy-readonly', variant: 'default' }],
  },
  {
    id: 'ssh-conn-2',
    type: 'ssh-connection',
    name: 'proxmox',
    detail: 'root@10.0.1.10:22',
    tags: [{ label: 'deploy-write', variant: 'default' }],
  },
];

const mockPublicKey =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHKz4g7R5pL9xF2nJqT8wM3vKxY6dB0cH1fQzU+pA2Lm faultline-deploy-readonly';

/* ── Helper: group by type ────────────────────────────────────────── */

const groupByType = (items: IntegrationItem[]): Record<IntegrationType, IntegrationItem[]> => {
  const groups: Record<IntegrationType, IntegrationItem[]> = {
    'ssh-identity': [],
    'git-repo': [],
    kubernetes: [],
    argocd: [],
    'ssh-connection': [],
  };
  for (const item of items) {
    groups[item.type].push(item);
  }
  return groups;
};

/* ══════════════════════════════════════════════════════════════════════
 * EMPTY — no integrations configured yet
 *
 * The agent can still work, but has no access to external systems.
 * A gentle nudge, not an error. The empty state is calm — it tells
 * the user what integrations are for, not that something is wrong.
 * ══════════════════════════════════════════════════════════════════════ */

const Empty = (): React.ReactElement => (
  <SettingsShell title="Settings" tabs={[{ id: 'integrations', label: 'Integrations' }]} activeTab="integrations">
    <motion.div {...fadeUp} className="text-center py-16">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/4 mb-4">
        <Server size={18} className="text-text-muted" />
      </div>
      <h2 className="text-base font-medium text-text mb-2">No integrations yet</h2>
      <p className="text-sm text-text-muted max-w-xs mx-auto leading-relaxed mb-6">
        Integrations give the agent access to your infrastructure — SSH keys, git repos, Kubernetes clusters, and more.
        Add them as you need them.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {(Object.entries(integrationTypes) as [IntegrationType, (typeof integrationTypes)[IntegrationType]][]).map(
          ([type, config]) => {
            const Icon = config.icon;
            return (
              <Button key={type} variant="secondary" size="sm" icon={Icon}>
                {config.singular}
              </Button>
            );
          },
        )}
      </div>
    </motion.div>
  </SettingsShell>
);

/* ══════════════════════════════════════════════════════════════════════
 * POPULATED — several integrations configured
 *
 * The main view. Integrations are grouped by type, each with a
 * compact row showing name, key detail, and relevant tags. Click
 * to edit. Section headers have an "Add" shortcut.
 * ══════════════════════════════════════════════════════════════════════ */

const Populated = (): React.ReactElement => {
  const groups = groupByType(mockIntegrations);
  let globalIndex = 0;

  return (
    <SettingsShell title="Settings" tabs={[{ id: 'integrations', label: 'Integrations' }]} activeTab="integrations">
      {(Object.entries(groups) as [IntegrationType, IntegrationItem[]][])
        .filter(([, items]) => items.length > 0)
        .map(([type, items], sectionIndex) => (
          <div key={type}>
            <SectionHeader type={type} delay={sectionIndex * 0.08} />
            <div className="divide-y divide-white/5">
              {items.map((item) => {
                const idx = globalIndex++;
                return <IntegrationRow key={item.id} item={item} delay={0.1 + idx * 0.04} />;
              })}
            </div>
          </div>
        ))}
    </SettingsShell>
  );
};

/* ══════════════════════════════════════════════════════════════════════
 * NEW SSH IDENTITY — generate a new keypair
 *
 * The most security-sensitive form. The server generates the key —
 * the private key never leaves the host. The user only sees (and
 * copies) the public key to add to GitHub, GitLab, or authorized_keys.
 *
 * Stage-based access control is configured separately — this form
 * only handles the identity itself.
 * ══════════════════════════════════════════════════════════════════════ */

const NewSshIdentityGenerate = (): React.ReactElement => (
  <IntegrationForm title="New SSH Identity" onBack={() => undefined} onSave={() => undefined}>
    <AnimatedField index={0}>
      <FormField label="Name" description="How you'll refer to this key elsewhere in Faultline">
        <Input placeholder="deploy-readonly" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <FormField label="Key source">
        <ToggleGroup
          value="generate"
          options={[
            { value: 'generate', label: 'Generate' },
            { value: 'import', label: 'Import' },
          ]}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={2}>
      <div className="flex items-start gap-2.5 bg-white/3 rounded-xl px-4 py-3">
        <Shield size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
        <span className="text-sm text-text-secondary leading-relaxed">
          An ed25519 keypair will be generated on the server. The private key never leaves the host.
        </span>
      </div>
    </AnimatedField>
  </IntegrationForm>
);

/* ══════════════════════════════════════════════════════════════════════
 * NEW SSH IDENTITY — import an existing key
 *
 * For users who already have keys they want to reuse. Paste the
 * private key — it's stored on the server, never sent back.
 * ══════════════════════════════════════════════════════════════════════ */

const NewSshIdentityImport = (): React.ReactElement => (
  <IntegrationForm title="New SSH Identity" onBack={() => undefined} onSave={() => undefined}>
    <AnimatedField index={0}>
      <FormField label="Name" description="How you'll refer to this key elsewhere in Faultline">
        <Input placeholder="deploy-readonly" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <FormField label="Key source">
        <ToggleGroup
          value="import"
          options={[
            { value: 'generate', label: 'Generate' },
            { value: 'import', label: 'Import' },
          ]}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={2}>
      <FormField
        label="Private key"
        description="Paste your key here. It stays on the server and is never sent back to the browser."
      >
        <TextArea placeholder={'-----BEGIN OPENSSH PRIVATE KEY-----\n...'} rows={6} mono />
      </FormField>
    </AnimatedField>
  </IntegrationForm>
);

/* ══════════════════════════════════════════════════════════════════════
 * EDIT SSH IDENTITY — view public key, update settings
 *
 * After creation, the public key is displayed for copying. The
 * private key is never shown — only a confirmation that it exists.
 * ══════════════════════════════════════════════════════════════════════ */

const EditSshIdentity = (): React.ReactElement => (
  <IntegrationForm
    title="Edit SSH Identity"
    isEdit
    onBack={() => undefined}
    onSave={() => undefined}
    onDelete={() => undefined}
  >
    <AnimatedField index={0}>
      <FormField label="Name">
        <Input value="deploy-readonly" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <CopyBlock label="Public key" value={mockPublicKey} />
    </AnimatedField>

    <AnimatedField index={2}>
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Check size={14} className="text-green-400" />
        <span>Private key stored on server · ed25519 · created 2 weeks ago</span>
      </div>
    </AnimatedField>
  </IntegrationForm>
);

/* ══════════════════════════════════════════════════════════════════════
 * NEW GIT REPOSITORY — connect a gitops repo
 *
 * The agent clones this repo into its workspace and can make
 * changes during implementation. The SSH identity determines
 * whether it can push. Description helps the agent understand
 * what the repo contains.
 * ══════════════════════════════════════════════════════════════════════ */

const NewGitRepo = (): React.ReactElement => (
  <IntegrationForm title="New Git Repository" onBack={() => undefined} onSave={() => undefined}>
    <AnimatedField index={0}>
      <FormField label="Name" description="A short name for this repo">
        <Input placeholder="infra-gitops" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <FormField label="Clone URL" description="The SSH address the agent uses to fetch and push">
        <Input placeholder="git@github.com:acme/infra-gitops.git" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={2}>
      <FormField label="Description" description="Helps the agent understand what this repo is for">
        <TextArea placeholder="Kubernetes manifests for the homelab cluster." rows={3} />
      </FormField>
    </AnimatedField>

    <AnimatedField index={3}>
      <FormField label="SSH Identity" description="Which key to use when talking to this remote">
        <Select
          value=""
          placeholder="Select an SSH identity…"
          options={[
            { value: 'ssh-1', label: 'deploy-readonly' },
            { value: 'ssh-2', label: 'deploy-write' },
          ]}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={4}>
      <FormField label="Default branch">
        <Input value="main" />
      </FormField>
    </AnimatedField>
  </IntegrationForm>
);

/* ══════════════════════════════════════════════════════════════════════
 * NEW KUBERNETES — connect a cluster context
 *
 * The agent uses this to run kubectl commands. Context name maps
 * to an entry in the kubeconfig on the server host.
 * ══════════════════════════════════════════════════════════════════════ */

const NewKubernetes = (): React.ReactElement => (
  <IntegrationForm title="New Kubernetes Context" onBack={() => undefined} onSave={() => undefined}>
    <AnimatedField index={0}>
      <FormField label="Name" description="A friendly name for this cluster">
        <Input placeholder="homelab-prod" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <FormField label="Kube context" description="The context from the server's kubeconfig to use">
        <Select
          value=""
          placeholder="Select a context…"
          options={[
            { value: 'homelab-prod', label: 'homelab-prod' },
            { value: 'homelab-staging', label: 'homelab-staging' },
            { value: 'dev-local', label: 'dev-local' },
          ]}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={2}>
      <FormField label="Description" description="Helps the agent understand this cluster's role">
        <TextArea placeholder="Production homelab cluster running Traefik and ArgoCD." rows={2} />
      </FormField>
    </AnimatedField>
  </IntegrationForm>
);

/* ══════════════════════════════════════════════════════════════════════
 * NEW ARGOCD — connect an Argo CD instance
 *
 * The agent can check sync status, trigger syncs, and understand
 * deployment state through the ArgoCD API.
 * ══════════════════════════════════════════════════════════════════════ */

const NewArgocd = (): React.ReactElement => (
  <IntegrationForm title="New ArgoCD Instance" onBack={() => undefined} onSave={() => undefined}>
    <AnimatedField index={0}>
      <FormField label="Name" description="A friendly name for this instance">
        <Input placeholder="homelab-argo" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <FormField label="Server URL">
        <Input placeholder="https://argocd.homelab.local" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={2}>
      <FormField label="Auth token" description="An API token for the agent. Stored on the server, never sent back.">
        <Input placeholder="eyJhbGciOiJIUzI1NiIs…" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={3}>
      <FormField label="Description">
        <TextArea placeholder="Manages all homelab deployments. Watches the infra-gitops repo." rows={2} />
      </FormField>
    </AnimatedField>
  </IntegrationForm>
);

/* ══════════════════════════════════════════════════════════════════════
 * NEW SSH CONNECTION — remote host access
 *
 * The agent SSHes into this host to run commands — checking disk
 * health, restarting services, gathering logs. Uses an SSH identity
 * for authentication.
 * ══════════════════════════════════════════════════════════════════════ */

const NewSshConnection = (): React.ReactElement => (
  <IntegrationForm title="New SSH Connection" onBack={() => undefined} onSave={() => undefined}>
    <AnimatedField index={0}>
      <FormField label="Name" description="A friendly name for this host">
        <Input placeholder="nas" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={1}>
      <FormField label="Host">
        <Input placeholder="10.0.1.50" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={2}>
      <FormField label="Port">
        <Input value="22" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={3}>
      <FormField label="Username">
        <Input placeholder="admin" />
      </FormField>
    </AnimatedField>

    <AnimatedField index={4}>
      <FormField label="SSH Identity" description="Which key to use when connecting">
        <Select
          value=""
          placeholder="Select an SSH identity…"
          options={[
            { value: 'ssh-1', label: 'deploy-readonly' },
            { value: 'ssh-2', label: 'deploy-write' },
          ]}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={5}>
      <FormField label="Description" description="Helps the agent understand what this host does">
        <TextArea placeholder="Synology NAS running ZFS. Hosts backups and home automation data." rows={2} />
      </FormField>
    </AnimatedField>
  </IntegrationForm>
);

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Pages/Settings — Integrations',
  parameters: {
    layout: 'fullscreen',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
};

type Story = StoryObj;

const NoIntegrations: Story = { render: Empty };
const AllConfigured: Story = { render: Populated };
const AddSshIdentityGenerate: Story = { render: NewSshIdentityGenerate };
const AddSshIdentityImport: Story = { render: NewSshIdentityImport };
const EditExistingSshIdentity: Story = { render: EditSshIdentity };
const AddGitRepository: Story = { render: NewGitRepo };
const AddKubernetesContext: Story = { render: NewKubernetes };
const AddArgocdInstance: Story = { render: NewArgocd };
const AddSshConnection: Story = { render: NewSshConnection };

export {
  NoIntegrations,
  AllConfigured,
  AddSshIdentityGenerate,
  AddSshIdentityImport,
  EditExistingSshIdentity,
  AddGitRepository,
  AddKubernetesContext,
  AddArgocdInstance,
  AddSshConnection,
};
export default meta;
