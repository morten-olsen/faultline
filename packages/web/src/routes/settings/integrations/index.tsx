import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Server } from "lucide-react"
import { useClient } from "../../../client/client.context.js"
import { SettingsShell } from "../../../components/settings-shell/settings-shell.tsx"
import { Button } from "../../../components/button/button.tsx"
import {
  SectionHeader,
  IntegrationRow,
  integrationTypes,
} from "../../../components/integration-list/integration-list.tsx"

import type { SshIdentity, GitRepo, KubeContext, ArgocdInstance, SshConnection } from "@faultline/protocol"
import type { IntegrationType, IntegrationItem } from "../../../components/integration-list/integration-list.tsx"

/* ── Helpers ──────────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const },
}

const toItems = (
  identities: SshIdentity[],
  repos: GitRepo[],
  contexts: KubeContext[],
  instances: ArgocdInstance[],
  connections: SshConnection[],
  identityMap: Map<string, string>,
): IntegrationItem[] => [
  ...identities.map((i): IntegrationItem => ({
    id: i.id,
    type: "ssh-identity",
    name: i.name,
    detail: `${i.keyType} · created ${new Date(i.createdAt).toLocaleDateString()}`,
  })),
  ...repos.map((r): IntegrationItem => ({
    id: r.id,
    type: "git-repo",
    name: r.name,
    detail: r.cloneUrl,
    tags: r.sshIdentityId && identityMap.has(r.sshIdentityId)
      ? [{ label: identityMap.get(r.sshIdentityId)!, variant: "default" as const }]
      : undefined,
  })),
  ...contexts.map((c): IntegrationItem => ({
    id: c.id,
    type: "kubernetes",
    name: c.name,
    detail: `context: ${c.context}`,
  })),
  ...instances.map((a): IntegrationItem => ({
    id: a.id,
    type: "argocd",
    name: a.name,
    detail: a.serverUrl,
  })),
  ...connections.map((c): IntegrationItem => ({
    id: c.id,
    type: "ssh-connection",
    name: c.name,
    detail: `${c.username}@${c.host}:${c.port}`,
    tags: c.sshIdentityId && identityMap.has(c.sshIdentityId)
      ? [{ label: identityMap.get(c.sshIdentityId)!, variant: "default" as const }]
      : undefined,
  })),
]

const groupByType = (items: IntegrationItem[]): Record<IntegrationType, IntegrationItem[]> => {
  const groups: Record<IntegrationType, IntegrationItem[]> = {
    "ssh-identity": [],
    "git-repo": [],
    "kubernetes": [],
    "argocd": [],
    "ssh-connection": [],
  }
  for (const item of items) {
    groups[item.type].push(item)
  }
  return groups
}

const addRoutes: Record<IntegrationType, string> = {
  "ssh-identity": "/settings/integrations/ssh-identity/new",
  "git-repo": "/settings/integrations/git-repo/new",
  "kubernetes": "/settings/integrations/kubernetes/new",
  "argocd": "/settings/integrations/argocd/new",
  "ssh-connection": "/settings/integrations/ssh-connection/new",
}

const editRoutes: Record<IntegrationType, (id: string) => string> = {
  "ssh-identity": (id) => `/settings/integrations/ssh-identity/${id}/edit`,
  "git-repo": (id) => `/settings/integrations/git-repo/${id}/edit`,
  "kubernetes": (id) => `/settings/integrations/kubernetes/${id}/edit`,
  "argocd": (id) => `/settings/integrations/argocd/${id}/edit`,
  "ssh-connection": (id) => `/settings/integrations/ssh-connection/${id}/edit`,
}

/* ── Page ──────────────────────────────────────────────────────────── */

const IntegrationsIndex = (): React.ReactElement => {
  const client = useClient()
  const navigate = useNavigate()

  const { data: identitiesData } = useQuery({
    queryKey: ["sshIdentities"],
    queryFn: () => client.call["sshIdentities.list"]({}),
  })
  const { data: reposData } = useQuery({
    queryKey: ["gitRepos"],
    queryFn: () => client.call["gitRepos.list"]({}),
  })
  const { data: contextsData } = useQuery({
    queryKey: ["kubeContexts"],
    queryFn: () => client.call["kubeContexts.list"]({}),
  })
  const { data: instancesData } = useQuery({
    queryKey: ["argoInstances"],
    queryFn: () => client.call["argoInstances.list"]({}),
  })
  const { data: connectionsData } = useQuery({
    queryKey: ["sshConnections"],
    queryFn: () => client.call["sshConnections.list"]({}),
  })

  const identities = identitiesData?.identities ?? []
  const repos = reposData?.repos ?? []
  const contexts = contextsData?.contexts ?? []
  const instances = instancesData?.instances ?? []
  const connections = connectionsData?.connections ?? []

  const identityMap = new Map(identities.map((i) => [i.id, i.name]))

  const items = toItems(identities, repos, contexts, instances, connections, identityMap)
  const groups = groupByType(items)
  const hasAny = items.length > 0

  let globalIndex = 0

  return (
    <SettingsShell
      title="Settings"
      tabs={[
        { id: "integrations", label: "Integrations" },
        { id: "stage-configs", label: "Stage Configs" },
      ]}
      activeTab="integrations"
      onBack={() => navigate({ to: "/" })}
      onTabChange={(id) => {
        if (id === "stage-configs") navigate({ to: "/settings/stage-configs" })
      }}
    >
      {!hasAny ? (
        <motion.div {...fadeUp} className="text-center py-16">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/4 mb-4">
            <Server size={18} className="text-text-muted" />
          </div>
          <h2 className="text-base font-medium text-text mb-2">No integrations yet</h2>
          <p className="text-sm text-text-muted max-w-xs mx-auto leading-relaxed mb-6">
            Integrations give the agent access to your infrastructure — SSH keys,
            git repos, Kubernetes clusters, and more. Add them as you need them.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.entries(integrationTypes) as [IntegrationType, (typeof integrationTypes)[IntegrationType]][]).map(([type, config]) => {
              const Icon = config.icon
              return (
                <Button
                  key={type}
                  variant="secondary"
                  size="sm"
                  icon={Icon}
                  onClick={() => navigate({ to: addRoutes[type] })}
                >
                  {config.singular}
                </Button>
              )
            })}
          </div>
        </motion.div>
      ) : (
        (Object.entries(groups) as [IntegrationType, IntegrationItem[]][])
          .map(([type, groupItems], sectionIndex) => (
            <div key={type}>
              <SectionHeader
                type={type}
                delay={sectionIndex * 0.08}
                onAdd={() => navigate({ to: addRoutes[type] })}
              />
              {groupItems.length > 0 && (
                <div className="divide-y divide-white/5">
                  {groupItems.map((item) => {
                    const idx = globalIndex++
                    return (
                      <IntegrationRow
                        key={item.id}
                        item={item}
                        delay={0.1 + idx * 0.04}
                        onClick={() => navigate({ to: editRoutes[item.type](item.id) })}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          ))
      )}
    </SettingsShell>
  )
}

/* ── Route ────────────────────────────────────────────────────────── */

const Route = createFileRoute("/settings/integrations/")({
  component: IntegrationsIndex,
})

export { Route }
