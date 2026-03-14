import { z } from 'zod';

// ── SSH identities ──────────────────────────────────────────────────

const createSshIdentitySchema = z.object({
  name: z.string().min(1),
  source: z.enum(['generate', 'import']),
  privateKey: z.string().optional(),
});

type CreateSshIdentityInput = z.infer<typeof createSshIdentitySchema>;

const updateSshIdentitySchema = z.object({
  name: z.string().min(1).optional(),
});

type UpdateSshIdentityInput = z.infer<typeof updateSshIdentitySchema>;

// ── Git repositories ────────────────────────────────────────────────

const createGitRepoSchema = z.object({
  name: z.string().min(1),
  cloneUrl: z.string().min(1),
  description: z.string().nullable().default(null),
  sshIdentityId: z.string().uuid().nullable().default(null),
  defaultBranch: z.string().default('main'),
});

type CreateGitRepoInput = z.infer<typeof createGitRepoSchema>;

const updateGitRepoSchema = z.object({
  name: z.string().min(1).optional(),
  cloneUrl: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  sshIdentityId: z.string().uuid().nullable().optional(),
  defaultBranch: z.string().optional(),
});

type UpdateGitRepoInput = z.infer<typeof updateGitRepoSchema>;

// ── Kubernetes contexts ─────────────────────────────────────────────

const createKubeContextSchema = z.object({
  name: z.string().min(1),
  context: z.string().min(1),
  description: z.string().nullable().default(null),
});

type CreateKubeContextInput = z.infer<typeof createKubeContextSchema>;

const updateKubeContextSchema = z.object({
  name: z.string().min(1).optional(),
  context: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

type UpdateKubeContextInput = z.infer<typeof updateKubeContextSchema>;

// ── ArgoCD instances ────────────────────────────────────────────────

const createArgocdInstanceSchema = z.object({
  name: z.string().min(1),
  serverUrl: z.string().min(1),
  authToken: z.string().min(1),
  description: z.string().nullable().default(null),
});

type CreateArgocdInstanceInput = z.infer<typeof createArgocdInstanceSchema>;

const updateArgocdInstanceSchema = z.object({
  name: z.string().min(1).optional(),
  serverUrl: z.string().min(1).optional(),
  authToken: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

type UpdateArgocdInstanceInput = z.infer<typeof updateArgocdInstanceSchema>;

// ── SSH connections ─────────────────────────────────────────────────

const createSshConnectionSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().default(22),
  username: z.string().min(1),
  sshIdentityId: z.string().uuid().nullable().default(null),
  description: z.string().nullable().default(null),
});

type CreateSshConnectionInput = z.infer<typeof createSshConnectionSchema>;

const updateSshConnectionSchema = z.object({
  name: z.string().min(1).optional(),
  host: z.string().min(1).optional(),
  port: z.number().int().optional(),
  username: z.string().min(1).optional(),
  sshIdentityId: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
});

type UpdateSshConnectionInput = z.infer<typeof updateSshConnectionSchema>;

export type {
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
};
export {
  createSshIdentitySchema,
  updateSshIdentitySchema,
  createGitRepoSchema,
  updateGitRepoSchema,
  createKubeContextSchema,
  updateKubeContextSchema,
  createArgocdInstanceSchema,
  updateArgocdInstanceSchema,
  createSshConnectionSchema,
  updateSshConnectionSchema,
};
