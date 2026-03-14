import { z } from 'zod';

const upsertStageConfigSchema = z.object({
  stage: z.string().min(1),
  allowedKubeContexts: z.array(z.string()).nullable().default(null),
  allowedSshConnections: z.array(z.string()).nullable().default(null),
  allowedGitRepos: z.array(z.string()).nullable().default(null),
  allowedArgocdInstances: z.array(z.string()).nullable().default(null),
  sshIdentityId: z.string().uuid().nullable().default(null),
  additionalSystemPrompt: z.string().nullable().default(null),
});

type UpsertStageConfigInput = z.infer<typeof upsertStageConfigSchema>;

export type { UpsertStageConfigInput };
export { upsertStageConfigSchema };
