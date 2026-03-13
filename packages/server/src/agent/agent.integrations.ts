import type {
  SshIdentity,
  GitRepo,
  KubeContext,
  ArgocdInstance,
  SshConnection,
} from "../integrations/integrations.js";

type IntegrationReader = {
  listSshIdentities: () => Promise<SshIdentity[]>;
  listGitRepos: () => Promise<GitRepo[]>;
  listKubeContexts: () => Promise<KubeContext[]>;
  listArgocdInstances: () => Promise<ArgocdInstance[]>;
  listSshConnections: () => Promise<SshConnection[]>;
  getSshIdentity: (id: string) => Promise<SshIdentity | undefined>;
  getGitRepo: (id: string) => Promise<GitRepo | undefined>;
  getKubeContext: (id: string) => Promise<KubeContext | undefined>;
  getArgocdInstance: (id: string) => Promise<ArgocdInstance | undefined>;
  getSshConnection: (id: string) => Promise<SshConnection | undefined>;
};

type ScopeConfig = {
  allowedKubeContexts: string[] | null;
  allowedSshConnections: string[] | null;
  allowedGitRepos: string[] | null;
  allowedArgocdInstances: string[] | null;
  sshIdentityId: string | null;
};

const filterByIds = <T extends { id: string }>(
  items: T[],
  allowed: string[] | null,
): T[] => {
  if (allowed === null) return items;
  const set = new Set(allowed);
  return items.filter((item) => set.has(item.id));
};

const guardGet = <T extends { id: string }>(
  allowed: string[] | null,
  getter: (id: string) => Promise<T | undefined>,
): ((id: string) => Promise<T | undefined>) => {
  if (allowed === null) return getter;
  const set = new Set(allowed);
  return async (id: string): Promise<T | undefined> => {
    if (!set.has(id)) return undefined;
    return getter(id);
  };
};

const createScopedIntegrationService = (
  inner: IntegrationReader,
  config: ScopeConfig,
): IntegrationReader => ({
  listSshIdentities: () => inner.listSshIdentities(),
  listGitRepos: async () =>
    filterByIds(await inner.listGitRepos(), config.allowedGitRepos),
  listKubeContexts: async () =>
    filterByIds(await inner.listKubeContexts(), config.allowedKubeContexts),
  listArgocdInstances: async () =>
    filterByIds(await inner.listArgocdInstances(), config.allowedArgocdInstances),
  listSshConnections: async () =>
    filterByIds(await inner.listSshConnections(), config.allowedSshConnections),
  getSshIdentity: (id: string) => inner.getSshIdentity(id),
  getGitRepo: guardGet(config.allowedGitRepos, inner.getGitRepo),
  getKubeContext: guardGet(config.allowedKubeContexts, inner.getKubeContext),
  getArgocdInstance: guardGet(config.allowedArgocdInstances, inner.getArgocdInstance),
  getSshConnection: async (id: string): Promise<SshConnection | undefined> => {
    const guard = guardGet(config.allowedSshConnections, inner.getSshConnection);
    const conn = await guard(id);
    if (!conn) return undefined;

    if (!conn.ssh_identity_id && config.sshIdentityId) {
      return { ...conn, ssh_identity_id: config.sshIdentityId };
    }

    return conn;
  },
});

export type { IntegrationReader, ScopeConfig };
export { createScopedIntegrationService };
