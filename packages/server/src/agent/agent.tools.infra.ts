import { execFile } from 'node:child_process';
import { writeFileSync, chmodSync, unlinkSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

import { z } from 'zod';

import { defineTool } from './agent.tools.js';
import type { IntegrationReader } from './agent.integrations.js';
import type { Tool } from './agent.tools.js';

const execFileAsync = promisify(execFile);

const EXEC_TIMEOUT_MS = 30_000;

// ── SSH key temp file management ─────────────────────────────────────

type KeyFileTracker = {
  paths: Set<string>;
  write: (privateKey: string) => string;
  cleanup: () => void;
};

const createKeyFileTracker = (): KeyFileTracker => {
  const paths = new Set<string>();

  const write = (privateKey: string): string => {
    const path = join(tmpdir(), `faultline-key-${crypto.randomUUID()}`);
    writeFileSync(path, privateKey, { mode: 0o600 });
    chmodSync(path, 0o600);
    paths.add(path);
    return path;
  };

  const cleanup = (): void => {
    for (const p of paths) {
      try {
        unlinkSync(p);
      } catch {
        // already removed — ignore
      }
    }
    paths.clear();
  };

  return { paths, write, cleanup };
};

// ── Exec helper ──────────────────────────────────────────────────────

type ExecResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

// Base env for all infra subprocesses — disables the host SSH agent
// so only platform-managed identities are ever used.
const infraEnv = (): Record<string, string> => ({
  ...(process.env as Record<string, string>),
  SSH_AUTH_SOCK: '',
});

const runCommand = async (
  command: string,
  args: string[],
  options?: { env?: Record<string, string>; timeout?: number },
): Promise<ExecResult> => {
  try {
    const result = await execFileAsync(command, args, {
      timeout: options?.timeout ?? EXEC_TIMEOUT_MS,
      env: { ...infraEnv(), ...options?.env },
      maxBuffer: 1024 * 1024,
    });
    return { stdout: result.stdout, stderr: result.stderr, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number | string };
    const exitCode = typeof e.code === 'number' ? e.code : 1;
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? (err instanceof Error ? err.message : String(err)),
      exitCode,
    };
  }
};

// ── Tool definitions ─────────────────────────────────────────────────

const defineKubectlTool = (integrations: IntegrationReader): Tool =>
  defineTool({
    name: 'kubectl',
    description:
      'Execute kubectl against a configured Kubernetes context. ' +
      'Use list-integrations to discover available context IDs.',
    access: 'write',
    input: {
      contextId: z.string().uuid().describe('ID of the configured kube context'),
      args: z.string().describe("kubectl arguments (e.g. 'get pods -n default')"),
    },
    output: z.object({
      stdout: z.string(),
      stderr: z.string(),
      exitCode: z.number(),
    }),
    execute: async (input) => {
      const ctx = await integrations.getKubeContext(input.contextId);
      if (!ctx) {
        return { stdout: '', stderr: `Kube context ${input.contextId} not found`, exitCode: 1 };
      }
      const parts = input.args.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
      return runCommand('kubectl', [`--context=${ctx.context}`, ...parts]);
    },
  });

const defineSshExecTool = (integrations: IntegrationReader, keys: KeyFileTracker): Tool =>
  defineTool({
    name: 'ssh-exec',
    description:
      'Execute a command on a remote host via a configured SSH connection. ' +
      'Use list-integrations to discover available connection IDs.',
    access: 'write',
    input: {
      connectionId: z.string().uuid().describe('ID of the configured SSH connection'),
      command: z.string().describe('Command to run on the remote host'),
    },
    output: z.object({
      stdout: z.string(),
      stderr: z.string(),
      exitCode: z.number(),
    }),
    execute: async (input) => {
      const conn = await integrations.getSshConnection(input.connectionId);
      if (!conn) {
        return { stdout: '', stderr: `SSH connection ${input.connectionId} not found`, exitCode: 1 };
      }

      const sshArgs = [
        '-o',
        'StrictHostKeyChecking=accept-new',
        '-o',
        'BatchMode=yes',
        '-o',
        'IdentitiesOnly=yes',
        '-p',
        String(conn.port),
      ];

      if (conn.ssh_identity_id) {
        const identity = await integrations.getSshIdentity(conn.ssh_identity_id);
        if (!identity) {
          return { stdout: '', stderr: `SSH identity ${conn.ssh_identity_id} not found`, exitCode: 1 };
        }
        const keyPath = keys.write(identity.private_key);
        sshArgs.push('-i', keyPath);
      }

      sshArgs.push(`${conn.username}@${conn.host}`, input.command);
      return runCommand('ssh', sshArgs);
    },
  });

const defineGitCloneTool = (integrations: IntegrationReader, keys: KeyFileTracker): Tool =>
  defineTool({
    name: 'git-clone',
    description:
      'Clone a configured git repository into the agent workspace. ' +
      'Use list-integrations to discover available repo IDs.',
    access: 'write',
    input: {
      repoId: z.string().uuid().describe('ID of the configured git repo'),
      targetDir: z.string().optional().describe('Subdirectory name (defaults to repo name)'),
    },
    output: z.object({
      path: z.string(),
      branch: z.string(),
      alreadyExisted: z.boolean(),
    }),
    execute: async (input) => {
      const repo = await integrations.getGitRepo(input.repoId);
      if (!repo) {
        throw new Error(`Git repo ${input.repoId} not found`);
      }

      const dirName = input.targetDir ?? repo.name;
      const targetPath = join(process.cwd(), dirName);

      if (existsSync(targetPath) && statSync(targetPath).isDirectory()) {
        return { path: targetPath, branch: repo.default_branch, alreadyExisted: true };
      }

      const env: Record<string, string> = {};
      if (repo.ssh_identity_id) {
        const identity = await integrations.getSshIdentity(repo.ssh_identity_id);
        if (!identity) {
          throw new Error(`SSH identity ${repo.ssh_identity_id} not found`);
        }
        const keyPath = keys.write(identity.private_key);
        env.GIT_SSH_COMMAND = `ssh -i ${keyPath} -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes`;
      }

      const result = await runCommand('git', ['clone', '--branch', repo.default_branch, repo.clone_url, targetPath], {
        env,
      });
      if (result.exitCode !== 0) {
        throw new Error(`git clone failed: ${result.stderr}`);
      }

      return { path: targetPath, branch: repo.default_branch, alreadyExisted: false };
    },
  });

const defineListIntegrationsTool = (integrations: IntegrationReader): Tool =>
  defineTool({
    name: 'list-integrations',
    description:
      'Discover all configured integrations (metadata only, no secrets). ' +
      'Returns IDs needed for kubectl, ssh-exec, and git-clone tools.',
    access: 'read',
    input: {},
    output: z.object({
      sshIdentities: z.array(z.object({ id: z.string(), name: z.string(), keyType: z.string() })),
      gitRepos: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          cloneUrl: z.string(),
          defaultBranch: z.string(),
          sshIdentityName: z.string().nullable(),
        }),
      ),
      kubeContexts: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          context: z.string(),
          description: z.string().nullable(),
        }),
      ),
      sshConnections: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          host: z.string(),
          port: z.number(),
          username: z.string(),
          sshIdentityName: z.string().nullable(),
          description: z.string().nullable(),
        }),
      ),
    }),
    execute: async () => {
      const [identities, repos, contexts, connections] = await Promise.all([
        integrations.listSshIdentities(),
        integrations.listGitRepos(),
        integrations.listKubeContexts(),
        integrations.listSshConnections(),
      ]);

      const identityNames = new Map(identities.map((i) => [i.id, i.name]));

      return {
        sshIdentities: identities.map((i) => ({ id: i.id, name: i.name, keyType: i.key_type })),
        gitRepos: repos.map((r) => ({
          id: r.id,
          name: r.name,
          cloneUrl: r.clone_url,
          defaultBranch: r.default_branch,
          sshIdentityName: r.ssh_identity_id ? (identityNames.get(r.ssh_identity_id) ?? null) : null,
        })),
        kubeContexts: contexts.map((c) => ({
          id: c.id,
          name: c.name,
          context: c.context,
          description: c.description,
        })),
        sshConnections: connections.map((c) => ({
          id: c.id,
          name: c.name,
          host: c.host,
          port: c.port,
          username: c.username,
          sshIdentityName: c.ssh_identity_id ? (identityNames.get(c.ssh_identity_id) ?? null) : null,
          description: c.description,
        })),
      };
    },
  });

// ── Factory ──────────────────────────────────────────────────────────

const createInfraTools = (integrations: IntegrationReader): { tools: Tool[]; cleanup: () => void } => {
  const keys = createKeyFileTracker();

  const tools: Tool[] = [
    defineKubectlTool(integrations),
    defineSshExecTool(integrations, keys),
    defineGitCloneTool(integrations, keys),
    defineListIntegrationsTool(integrations),
  ];

  return { tools, cleanup: keys.cleanup };
};

// ── Integration summary for system prompt ────────────────────────────

const buildIntegrationSummary = async (integrations: IntegrationReader): Promise<string> => {
  const [identities, repos, contexts, connections] = await Promise.all([
    integrations.listSshIdentities(),
    integrations.listGitRepos(),
    integrations.listKubeContexts(),
    integrations.listSshConnections(),
  ]);

  const identityNames = new Map(identities.map((i) => [i.id, i.name]));

  const lines: string[] = ['## Available Infrastructure', ''];

  if (identities.length > 0) {
    const items = identities.map((i) => `${i.name} (${i.key_type})`).join(', ');
    lines.push(`SSH Identities: ${items}`);
  }

  if (repos.length > 0) {
    const items = repos.map((r) => `${r.name} (${r.clone_url}, branch: ${r.default_branch})`).join(', ');
    lines.push(`Git Repos: ${items}`);
  }

  if (contexts.length > 0) {
    const items = contexts.map((c) => `${c.name} (context: ${c.context})`).join(', ');
    lines.push(`Kubernetes: ${items}`);
  }

  if (connections.length > 0) {
    const items = connections
      .map((c) => {
        const keyName = c.ssh_identity_id ? identityNames.get(c.ssh_identity_id) : null;
        const keySuffix = keyName ? `, key: ${keyName}` : '';
        return `${c.name} (${c.username}@${c.host}:${c.port}${keySuffix})`;
      })
      .join(', ');
    lines.push(`SSH Connections: ${items}`);
  }

  if (identities.length + repos.length + contexts.length + connections.length === 0) {
    lines.push('No integrations configured.');
  }

  lines.push('');
  lines.push('Use list-integrations to get IDs. Use kubectl, ssh-exec, git-clone tools to interact.');

  return lines.join('\n');
};

export { createInfraTools, buildIntegrationSummary };
