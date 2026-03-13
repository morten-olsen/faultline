import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'motion/react'
import { Layers, Info } from 'lucide-react'
import { SettingsShell } from '../../components/settings-shell/settings-shell.tsx'
import { IntegrationForm } from '../../components/integration-form/integration-form.tsx'
import { FormField } from '../../components/form-field/form-field.tsx'
import { TextArea } from '../../components/text-area/text-area.tsx'
import { Select } from '../../components/select/select.tsx'
import { AnimatedField } from '../../components/animated-field/animated-field.tsx'
import { AllowanceField } from '../../components/allowance-field/allowance-field.tsx'
import { StageConfigRow } from '../../components/stage-config-list/stage-config-list.tsx'

import type { StageConfigItem } from '../../components/stage-config-list/stage-config-list.tsx'

/*
 * Settings — Stage Configs
 *
 * Per-stage agent configuration. Controls what each agent can
 * access at each stage of the issue lifecycle. This is the
 * "access policy" layer — integrations are connected on the
 * Integrations page, but stage configs decide which of those
 * integrations the agent can see during triage vs implementation.
 *
 * The design philosophy: every stage is always visible, whether
 * configured or not. Unconfigured = unrestricted (backwards
 * compat, no lockdown by default). Configured = the user has
 * explicitly decided what the agent can touch at that stage.
 *
 * Each integration type uses an AllowanceField with three modes:
 * - All: unrestricted, agent can access everything (null)
 * - Select: pick specific integrations via dropdown + tags ([ids])
 * - None: agent has no access to this type ([])
 *
 * The "ignored" stage is special — issues in this stage are
 * excluded from agent processing entirely. It appears in the
 * list but its config form is minimal (just the prompt override).
 */

/* ── Animation presets ────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
}

/* ── Mock data ────────────────────────────────────────────────────── */

const allStagesUnconfigured: StageConfigItem[] = [
  { stage: 'triage', configured: false },
  { stage: 'investigation', configured: false },
  { stage: 'proposed-plan', configured: false },
  { stage: 'implementation', configured: false },
  { stage: 'monitoring', configured: false },
  { stage: 'resolved', configured: false },
  { stage: 'ignored', configured: false },
]

const mixedStages: StageConfigItem[] = [
  {
    stage: 'triage',
    configured: true,
    allowedCounts: { kubeContexts: 1, sshConnections: 0, gitRepos: 0, argocdInstances: null },
    hasAdditionalPrompt: true,
  },
  {
    stage: 'investigation',
    configured: true,
    allowedCounts: { kubeContexts: 1, sshConnections: 2, gitRepos: null, argocdInstances: null },
  },
  { stage: 'proposed-plan', configured: false },
  {
    stage: 'implementation',
    configured: true,
    allowedCounts: { kubeContexts: null, sshConnections: null, gitRepos: null, argocdInstances: null },
    hasFallbackIdentity: true,
    hasAdditionalPrompt: true,
  },
  { stage: 'monitoring', configured: false },
  { stage: 'resolved', configured: false },
  {
    stage: 'ignored',
    configured: true,
    allowedCounts: { kubeContexts: 0, sshConnections: 0, gitRepos: 0, argocdInstances: 0 },
  },
]

/* ── Mock integration options (for the edit form) ────────────────── */

const mockKubeOptions = [
  { value: 'k8s-1', label: 'homelab-prod' },
  { value: 'k8s-2', label: 'homelab-staging' },
]

const mockSshConnOptions = [
  { value: 'ssh-conn-1', label: 'nas (admin@10.0.1.50)' },
  { value: 'ssh-conn-2', label: 'proxmox (root@10.0.1.10)' },
]

const mockGitRepoOptions = [
  { value: 'git-1', label: 'infra-gitops' },
  { value: 'git-2', label: 'k8s-manifests' },
]

const mockArgoOptions = [
  { value: 'argo-1', label: 'homelab-argo' },
]

const mockSshIdentityOptions = [
  { value: 'ssh-1', label: 'deploy-readonly' },
  { value: 'ssh-2', label: 'deploy-write' },
]

/* ══════════════════════════════════════════════════════════════════════
 * DEFAULT — no stages configured
 *
 * Every stage is visible with "unrestricted" — the agent has full
 * access to all integrations at every stage. This is the starting
 * state. The info banner explains what stage configs are for, then
 * gets out of the way.
 * ══════════════════════════════════════════════════════════════════════ */

const Default = (): React.ReactElement => (
  <SettingsShell
    title="Settings"
    tabs={[
      { id: 'integrations', label: 'Integrations' },
      { id: 'stage-configs', label: 'Stage Configs' },
    ]}
    activeTab="stage-configs"
  >
    <motion.div {...fadeUp}>
      <div className="flex items-start gap-2.5 bg-white/3 rounded-xl px-4 py-3 mb-6">
        <Info size={14} className="text-text-muted mt-0.5 flex-shrink-0" />
        <span className="text-sm text-text-secondary leading-relaxed">
          Stage configs control what the agent can access at each stage of the issue
          lifecycle. Unconfigured stages are unrestricted — the agent can use all
          integrations. Configure a stage to limit access.
        </span>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.06 }}
      className="flex items-center gap-2 mb-3"
    >
      <Layers size={14} className="text-text-muted" />
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
        Issue Stages
      </span>
    </motion.div>

    <div className="divide-y divide-white/5">
      {allStagesUnconfigured.map((item, i) => (
        <StageConfigRow key={item.stage} item={item} delay={0.1 + i * 0.04} />
      ))}
    </div>
  </SettingsShell>
)

/* ══════════════════════════════════════════════════════════════════════
 * CONFIGURED — some stages have access policies
 *
 * Triage is locked down to read-only kube access. Investigation
 * allows kube + SSH. Implementation is unrestricted but has a
 * fallback identity and custom prompt. Ignored blocks all access.
 * ══════════════════════════════════════════════════════════════════════ */

const Configured = (): React.ReactElement => (
  <SettingsShell
    title="Settings"
    tabs={[
      { id: 'integrations', label: 'Integrations' },
      { id: 'stage-configs', label: 'Stage Configs' },
    ]}
    activeTab="stage-configs"
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 mb-3"
    >
      <Layers size={14} className="text-text-muted" />
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
        Issue Stages
      </span>
    </motion.div>

    <div className="divide-y divide-white/5">
      {mixedStages.map((item, i) => (
        <StageConfigRow key={item.stage} item={item} delay={0.06 + i * 0.04} />
      ))}
    </div>
  </SettingsShell>
)

/* ══════════════════════════════════════════════════════════════════════
 * EDIT TRIAGE — restrictive config for the triage stage
 *
 * During triage, the agent should only be able to read from one
 * cluster. No SSH, no git, no ArgoCD. A custom system prompt
 * tells the agent to focus on diagnosis, not fixes.
 *
 * Each integration type uses the AllowanceField with three modes:
 * All (unrestricted), Select (pick specific IDs), None (blocked).
 * Selected items appear as removable tags. The dropdown only shows
 * items not yet selected.
 * ══════════════════════════════════════════════════════════════════════ */

const EditTriage = (): React.ReactElement => (
  <IntegrationForm
    title="Triage — Stage Config"
    isEdit
    onBack={() => {}}
    onSave={() => {}}
    onDelete={() => {}}
  >
    <AnimatedField index={0}>
      <AllowanceField
        label="Kubernetes contexts"
        description="Which clusters the agent can access during triage"
        mode="select"
        selected={['k8s-1']}
        options={mockKubeOptions}
      />
    </AnimatedField>

    <AnimatedField index={1}>
      <AllowanceField
        label="SSH connections"
        description="Which hosts the agent can SSH into"
        mode="none"
        selected={[]}
        options={mockSshConnOptions}
      />
    </AnimatedField>

    <AnimatedField index={2}>
      <AllowanceField
        label="Git repositories"
        description="Which repos the agent can clone"
        mode="none"
        selected={[]}
        options={mockGitRepoOptions}
      />
    </AnimatedField>

    <AnimatedField index={3}>
      <AllowanceField
        label="ArgoCD instances"
        description="Which ArgoCD instances the agent can query"
        mode="all"
        selected={[]}
        options={mockArgoOptions}
      />
    </AnimatedField>

    <AnimatedField index={4}>
      <FormField
        label="Fallback SSH identity"
        description="Used when an SSH connection doesn't have its own identity set"
      >
        <Select
          value=""
          placeholder="None"
          options={mockSshIdentityOptions}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={5}>
      <FormField
        label="Additional system prompt"
        description="Appended to the agent's system prompt when working on issues in this stage"
      >
        <TextArea
          value="Focus on diagnosis and root cause analysis. Do not attempt fixes — escalate to the implementation stage if a fix is needed."
          rows={3}
        />
      </FormField>
    </AnimatedField>
  </IntegrationForm>
)

/* ══════════════════════════════════════════════════════════════════════
 * EDIT IMPLEMENTATION — permissive config with extras
 *
 * Implementation gets full access to everything (All mode on every
 * type) but has a fallback SSH identity and a custom prompt
 * reminding the agent to create PRs instead of pushing directly.
 * ══════════════════════════════════════════════════════════════════════ */

const EditImplementation = (): React.ReactElement => (
  <IntegrationForm
    title="Implementation — Stage Config"
    isEdit
    onBack={() => {}}
    onSave={() => {}}
    onDelete={() => {}}
  >
    <AnimatedField index={0}>
      <AllowanceField
        label="Kubernetes contexts"
        mode="all"
        selected={[]}
        options={mockKubeOptions}
      />
    </AnimatedField>

    <AnimatedField index={1}>
      <AllowanceField
        label="SSH connections"
        mode="all"
        selected={[]}
        options={mockSshConnOptions}
      />
    </AnimatedField>

    <AnimatedField index={2}>
      <AllowanceField
        label="Git repositories"
        mode="all"
        selected={[]}
        options={mockGitRepoOptions}
      />
    </AnimatedField>

    <AnimatedField index={3}>
      <AllowanceField
        label="ArgoCD instances"
        mode="all"
        selected={[]}
        options={mockArgoOptions}
      />
    </AnimatedField>

    <AnimatedField index={4}>
      <FormField
        label="Fallback SSH identity"
        description="Used when an SSH connection doesn't have its own identity set"
      >
        <Select
          value="ssh-2"
          placeholder="None"
          options={mockSshIdentityOptions}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={5}>
      <FormField
        label="Additional system prompt"
        description="Appended to the agent's system prompt when working on issues in this stage"
      >
        <TextArea
          value="Always create a pull request for changes. Never push directly to the default branch. Include a clear description of what was changed and why."
          rows={3}
        />
      </FormField>
    </AnimatedField>
  </IntegrationForm>
)

/* ══════════════════════════════════════════════════════════════════════
 * EDIT INVESTIGATION — partial restrictions, multiple selections
 *
 * Investigation allows one kube context and both SSH connections,
 * but the user could add more from the dropdown. Git repos and
 * ArgoCD are unrestricted. Shows the "select" mode with multiple
 * tags and a dropdown that still has available options.
 * ══════════════════════════════════════════════════════════════════════ */

const EditInvestigation = (): React.ReactElement => (
  <IntegrationForm
    title="Investigation — Stage Config"
    isEdit
    onBack={() => {}}
    onSave={() => {}}
    onDelete={() => {}}
  >
    <AnimatedField index={0}>
      <AllowanceField
        label="Kubernetes contexts"
        description="Which clusters the agent can access during investigation"
        mode="select"
        selected={['k8s-1']}
        options={mockKubeOptions}
      />
    </AnimatedField>

    <AnimatedField index={1}>
      <AllowanceField
        label="SSH connections"
        description="Which hosts the agent can SSH into"
        mode="select"
        selected={['ssh-conn-1', 'ssh-conn-2']}
        options={mockSshConnOptions}
      />
    </AnimatedField>

    <AnimatedField index={2}>
      <AllowanceField
        label="Git repositories"
        mode="all"
        selected={[]}
        options={mockGitRepoOptions}
      />
    </AnimatedField>

    <AnimatedField index={3}>
      <AllowanceField
        label="ArgoCD instances"
        mode="all"
        selected={[]}
        options={mockArgoOptions}
      />
    </AnimatedField>

    <AnimatedField index={4}>
      <FormField
        label="Fallback SSH identity"
        description="Used when an SSH connection doesn't have its own identity set"
      >
        <Select
          value=""
          placeholder="None"
          options={mockSshIdentityOptions}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={5}>
      <FormField
        label="Additional system prompt"
        description="Appended to the agent's system prompt when working on issues in this stage"
      >
        <TextArea
          placeholder="Any additional instructions for the agent at this stage…"
          rows={3}
        />
      </FormField>
    </AnimatedField>
  </IntegrationForm>
)

/* ══════════════════════════════════════════════════════════════════════
 * NEW CONFIG — configuring an unconfigured stage
 *
 * Starting from scratch. Every AllowanceField defaults to "All"
 * (unrestricted). The user toggles to "Select" or "None" to
 * restrict, then picks specific integrations from the dropdown.
 * ══════════════════════════════════════════════════════════════════════ */

const NewConfig = (): React.ReactElement => (
  <IntegrationForm
    title="Monitoring — Stage Config"
    onBack={() => {}}
    onSave={() => {}}
  >
    <AnimatedField index={0}>
      <AllowanceField
        label="Kubernetes contexts"
        description="Which clusters the agent can access during monitoring"
        mode="all"
        selected={[]}
        options={mockKubeOptions}
      />
    </AnimatedField>

    <AnimatedField index={1}>
      <AllowanceField
        label="SSH connections"
        description="Which hosts the agent can SSH into"
        mode="all"
        selected={[]}
        options={mockSshConnOptions}
      />
    </AnimatedField>

    <AnimatedField index={2}>
      <AllowanceField
        label="Git repositories"
        description="Which repos the agent can clone"
        mode="all"
        selected={[]}
        options={mockGitRepoOptions}
      />
    </AnimatedField>

    <AnimatedField index={3}>
      <AllowanceField
        label="ArgoCD instances"
        description="Which ArgoCD instances the agent can query"
        mode="all"
        selected={[]}
        options={mockArgoOptions}
      />
    </AnimatedField>

    <AnimatedField index={4}>
      <FormField
        label="Fallback SSH identity"
        description="Used when an SSH connection doesn't have its own identity set"
      >
        <Select
          value=""
          placeholder="None"
          options={mockSshIdentityOptions}
        />
      </FormField>
    </AnimatedField>

    <AnimatedField index={5}>
      <FormField
        label="Additional system prompt"
        description="Appended to the agent's system prompt when working on issues in this stage"
      >
        <TextArea
          placeholder="Any additional instructions for the agent at this stage…"
          rows={3}
        />
      </FormField>
    </AnimatedField>
  </IntegrationForm>
)

/* ══════════════════════════════════════════════════════════════════════ */

const meta: Meta = {
  title: 'Design System/Pages/Settings — Stage Configs',
  parameters: {
    layout: 'fullscreen',
  },
  globals: {
    backgrounds: { value: 'faultline' },
  },
}

type Story = StoryObj

const AllUnconfigured: Story = { render: Default }
const SomeConfigured: Story = { render: Configured }
const EditTriageConfig: Story = { render: EditTriage }
const EditImplementationConfig: Story = { render: EditImplementation }
const EditInvestigationConfig: Story = { render: EditInvestigation }
const NewStageConfig: Story = { render: NewConfig }

export {
  AllUnconfigured,
  SomeConfigured,
  EditTriageConfig,
  EditImplementationConfig,
  EditInvestigationConfig,
  NewStageConfig,
}
export default meta
