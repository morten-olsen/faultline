import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { Selectable } from 'kysely';

import { DatabaseService } from '../database/database.js';
import type { Services } from '../services/services.js';
import type {
  SshIdentitiesTable,
  GitReposTable,
  KubeContextsTable,
  ArgocdInstancesTable,
  SshConnectionsTable,
} from '../database/database.js';

import type {
  CreateSshIdentityInput,
  UpdateSshIdentityInput,
  CreateGitRepoInput,
  UpdateGitRepoInput,
  CreateKubeContextInput,
  UpdateKubeContextInput,
  CreateArgocdInstanceInput,
  UpdateArgocdInstanceInput,
  CreateSshConnectionInput,
  UpdateSshConnectionInput,
} from './integrations.schemas.js';

type SshIdentity = Selectable<SshIdentitiesTable>;
type GitRepo = Selectable<GitReposTable>;
type KubeContext = Selectable<KubeContextsTable>;
type ArgocdInstance = Selectable<ArgocdInstancesTable>;
type SshConnection = Selectable<SshConnectionsTable>;

// ── Key generation ────────────────────────────────────────────────────

const generateKeyPair = (name: string): { publicKey: string; privateKey: string } => {
  const dir = mkdtempSync(join(tmpdir(), 'faultline-keygen-'));
  const keyPath = join(dir, 'key');

  try {
    execSync(`ssh-keygen -t ed25519 -f "${keyPath}" -N "" -C "faultline-${name}"`, { stdio: 'pipe' });

    const privateKey = readFileSync(keyPath, 'utf-8');
    const publicKey = readFileSync(`${keyPath}.pub`, 'utf-8').trim();

    return { publicKey, privateKey };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

// ── Service ───────────────────────────────────────────────────────────

class IntegrationService {
  #services: Services;

  constructor(services: Services) {
    this.#services = services;
  }

  // ── SSH identities ────────────────────────────────────────────────

  createSshIdentity = async (input: CreateSshIdentityInput): Promise<SshIdentity> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    let publicKey: string;
    let privateKey: string;

    if (input.source === 'generate') {
      const pair = generateKeyPair(input.name);
      publicKey = pair.publicKey;
      privateKey = pair.privateKey;
    } else {
      if (!input.privateKey) {
        throw new Error('Private key is required when importing');
      }
      privateKey = input.privateKey;
      // Extract public key from private key using ssh-keygen
      const dir = mkdtempSync(join(tmpdir(), 'faultline-import-'));
      const keyPath = join(dir, 'key');
      try {
        const { writeFileSync, chmodSync } = await import('node:fs');
        writeFileSync(keyPath, privateKey, { mode: 0o600 });
        chmodSync(keyPath, 0o600);
        publicKey = execSync(`ssh-keygen -y -f "${keyPath}"`, {
          stdio: 'pipe',
        })
          .toString()
          .trim();
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }

    const identity: SshIdentity = {
      id: crypto.randomUUID(),
      name: input.name,
      key_type: 'ed25519',
      public_key: publicKey,
      private_key: privateKey,
      created_at: now,
      updated_at: now,
    };

    await db.insertInto('ssh_identities').values(identity).execute();

    return identity;
  };

  getSshIdentity = async (id: string): Promise<SshIdentity | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db.selectFrom('ssh_identities').selectAll().where('id', '=', id).executeTakeFirst();
  };

  listSshIdentities = async (): Promise<SshIdentity[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db.selectFrom('ssh_identities').selectAll().orderBy('created_at', 'desc').execute();
  };

  updateSshIdentity = async (id: string, input: UpdateSshIdentityInput): Promise<SshIdentity | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const values: Record<string, unknown> = { updated_at: now };
    if (input.name !== undefined) {
      values.name = input.name;
    }

    await db.updateTable('ssh_identities').set(values).where('id', '=', id).execute();

    return this.getSshIdentity(id);
  };

  deleteSshIdentity = async (id: string): Promise<boolean> => {
    const db = await this.#services.get(DatabaseService).instance;

    const result = await db.deleteFrom('ssh_identities').where('id', '=', id).execute();

    return result.length > 0;
  };

  // ── Git repositories ──────────────────────────────────────────────

  createGitRepo = async (input: CreateGitRepoInput): Promise<GitRepo> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const repo: GitRepo = {
      id: crypto.randomUUID(),
      name: input.name,
      clone_url: input.cloneUrl,
      description: input.description,
      ssh_identity_id: input.sshIdentityId,
      default_branch: input.defaultBranch,
      created_at: now,
      updated_at: now,
    };

    await db.insertInto('git_repos').values(repo).execute();

    return repo;
  };

  getGitRepo = async (id: string): Promise<GitRepo | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db.selectFrom('git_repos').selectAll().where('id', '=', id).executeTakeFirst();
  };

  listGitRepos = async (): Promise<GitRepo[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db.selectFrom('git_repos').selectAll().orderBy('created_at', 'desc').execute();
  };

  updateGitRepo = async (id: string, input: UpdateGitRepoInput): Promise<GitRepo | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const values: Record<string, unknown> = { updated_at: now };
    if (input.name !== undefined) {
      values.name = input.name;
    }
    if (input.cloneUrl !== undefined) {
      values.clone_url = input.cloneUrl;
    }
    if (input.description !== undefined) {
      values.description = input.description;
    }
    if (input.sshIdentityId !== undefined) {
      values.ssh_identity_id = input.sshIdentityId;
    }
    if (input.defaultBranch !== undefined) {
      values.default_branch = input.defaultBranch;
    }

    await db.updateTable('git_repos').set(values).where('id', '=', id).execute();

    return this.getGitRepo(id);
  };

  deleteGitRepo = async (id: string): Promise<boolean> => {
    const db = await this.#services.get(DatabaseService).instance;

    const result = await db.deleteFrom('git_repos').where('id', '=', id).execute();

    return result.length > 0;
  };

  // ── Kubernetes contexts ───────────────────────────────────────────

  createKubeContext = async (input: CreateKubeContextInput): Promise<KubeContext> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const ctx: KubeContext = {
      id: crypto.randomUUID(),
      name: input.name,
      context: input.context,
      description: input.description,
      created_at: now,
      updated_at: now,
    };

    await db.insertInto('kube_contexts').values(ctx).execute();

    return ctx;
  };

  getKubeContext = async (id: string): Promise<KubeContext | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db.selectFrom('kube_contexts').selectAll().where('id', '=', id).executeTakeFirst();
  };

  listKubeContexts = async (): Promise<KubeContext[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db.selectFrom('kube_contexts').selectAll().orderBy('created_at', 'desc').execute();
  };

  updateKubeContext = async (id: string, input: UpdateKubeContextInput): Promise<KubeContext | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const values: Record<string, unknown> = { updated_at: now };
    if (input.name !== undefined) {
      values.name = input.name;
    }
    if (input.context !== undefined) {
      values.context = input.context;
    }
    if (input.description !== undefined) {
      values.description = input.description;
    }

    await db.updateTable('kube_contexts').set(values).where('id', '=', id).execute();

    return this.getKubeContext(id);
  };

  deleteKubeContext = async (id: string): Promise<boolean> => {
    const db = await this.#services.get(DatabaseService).instance;

    const result = await db.deleteFrom('kube_contexts').where('id', '=', id).execute();

    return result.length > 0;
  };

  listAvailableKubeContexts = (): string[] => {
    try {
      const output = execSync('kubectl config get-contexts -o name', {
        stdio: 'pipe',
        timeout: 5000,
      })
        .toString()
        .trim();

      return output ? output.split('\n').filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  // ── ArgoCD instances ──────────────────────────────────────────────

  createArgocdInstance = async (input: CreateArgocdInstanceInput): Promise<ArgocdInstance> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const instance: ArgocdInstance = {
      id: crypto.randomUUID(),
      name: input.name,
      server_url: input.serverUrl,
      auth_token: input.authToken,
      description: input.description,
      created_at: now,
      updated_at: now,
    };

    await db.insertInto('argocd_instances').values(instance).execute();

    return instance;
  };

  getArgocdInstance = async (id: string): Promise<ArgocdInstance | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db.selectFrom('argocd_instances').selectAll().where('id', '=', id).executeTakeFirst();
  };

  listArgocdInstances = async (): Promise<ArgocdInstance[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db.selectFrom('argocd_instances').selectAll().orderBy('created_at', 'desc').execute();
  };

  updateArgocdInstance = async (id: string, input: UpdateArgocdInstanceInput): Promise<ArgocdInstance | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const values: Record<string, unknown> = { updated_at: now };
    if (input.name !== undefined) {
      values.name = input.name;
    }
    if (input.serverUrl !== undefined) {
      values.server_url = input.serverUrl;
    }
    if (input.authToken !== undefined) {
      values.auth_token = input.authToken;
    }
    if (input.description !== undefined) {
      values.description = input.description;
    }

    await db.updateTable('argocd_instances').set(values).where('id', '=', id).execute();

    return this.getArgocdInstance(id);
  };

  deleteArgocdInstance = async (id: string): Promise<boolean> => {
    const db = await this.#services.get(DatabaseService).instance;

    const result = await db.deleteFrom('argocd_instances').where('id', '=', id).execute();

    return result.length > 0;
  };

  // ── SSH connections ───────────────────────────────────────────────

  createSshConnection = async (input: CreateSshConnectionInput): Promise<SshConnection> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const conn: SshConnection = {
      id: crypto.randomUUID(),
      name: input.name,
      host: input.host,
      port: input.port,
      username: input.username,
      ssh_identity_id: input.sshIdentityId,
      description: input.description,
      created_at: now,
      updated_at: now,
    };

    await db.insertInto('ssh_connections').values(conn).execute();

    return conn;
  };

  getSshConnection = async (id: string): Promise<SshConnection | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db.selectFrom('ssh_connections').selectAll().where('id', '=', id).executeTakeFirst();
  };

  listSshConnections = async (): Promise<SshConnection[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    return db.selectFrom('ssh_connections').selectAll().orderBy('created_at', 'desc').execute();
  };

  updateSshConnection = async (id: string, input: UpdateSshConnectionInput): Promise<SshConnection | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const values: Record<string, unknown> = { updated_at: now };
    if (input.name !== undefined) {
      values.name = input.name;
    }
    if (input.host !== undefined) {
      values.host = input.host;
    }
    if (input.port !== undefined) {
      values.port = input.port;
    }
    if (input.username !== undefined) {
      values.username = input.username;
    }
    if (input.sshIdentityId !== undefined) {
      values.ssh_identity_id = input.sshIdentityId;
    }
    if (input.description !== undefined) {
      values.description = input.description;
    }

    await db.updateTable('ssh_connections').set(values).where('id', '=', id).execute();

    return this.getSshConnection(id);
  };

  deleteSshConnection = async (id: string): Promise<boolean> => {
    const db = await this.#services.get(DatabaseService).instance;

    const result = await db.deleteFrom('ssh_connections').where('id', '=', id).execute();

    return result.length > 0;
  };
}

export type { SshIdentity, GitRepo, KubeContext, ArgocdInstance, SshConnection };
export { IntegrationService };
