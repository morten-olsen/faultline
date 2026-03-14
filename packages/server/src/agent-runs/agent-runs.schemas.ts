import { z } from 'zod';

import { agentStepKinds } from '../issues/issues.types.js';

const createAgentLoopSchema = z.object({
  title: z.string().min(1),
});

type CreateAgentLoopInput = z.infer<typeof createAgentLoopSchema>;

const createAgentStepSchema = z.object({
  agentLoopId: z.string().uuid(),
  kind: z.enum(agentStepKinds),
  title: z.string().min(1),
  status: z.string().nullable().default(null),
  detail: z.string().nullable().default(null),
  output: z.string().nullable().default(null),
  durationMs: z.number().int().nullable().default(null),
});

type CreateAgentStepInput = z.infer<typeof createAgentStepSchema>;

export type { CreateAgentLoopInput, CreateAgentStepInput };
export { createAgentLoopSchema, createAgentStepSchema };
