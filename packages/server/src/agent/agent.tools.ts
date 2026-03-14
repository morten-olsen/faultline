import { z } from 'zod';

// ── Access levels ─────────────────────────────────────────────────
// Ordered from least to most privileged. A phase's access level
// determines the maximum tool access allowed.

const toolAccessLevels = ['read', 'write', 'dangerous'] as const;

type ToolAccess = (typeof toolAccessLevels)[number];

// ── Tool definition ───────────────────────────────────────────────
// Runtime representation stored in the registry. Generic type
// params are erased here — use defineTool() for type-safe creation.

type Tool = {
  name: string;
  description: string;
  access: ToolAccess;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  outputSchema: z.ZodType;
  execute: (args: unknown) => Promise<unknown>;
};

// ── defineTool() — type-safe tool factory ─────────────────────────
// Infers input/output types from Zod schemas so the execute
// function is fully typed. Erases generics for the registry.

const defineTool = <I extends z.ZodRawShape, O extends z.ZodType>(config: {
  name: string;
  description: string;
  access: ToolAccess;
  input: I;
  output: O;
  execute: (args: z.objectOutputType<I, z.ZodTypeAny>) => Promise<z.output<O>>;
}): Tool => ({
  name: config.name,
  description: config.description,
  access: config.access,
  inputSchema: z.object(config.input),
  outputSchema: config.output,
  execute: config.execute as (args: unknown) => Promise<unknown>,
});

// ── Built-in SDK tools by access level ────────────────────────────
// These control which of the SDK's own tools (Read, Bash, etc.)
// are made available to the agent at each access level.

const builtinToolsByAccess: Record<ToolAccess, readonly string[]> = {
  read: ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch'],
  write: ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit', 'WebSearch', 'WebFetch'],
  dangerous: ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit', 'WebSearch', 'WebFetch'],
};

// ── Resolution helpers ────────────────────────────────────────────

const accessIndex = (access: ToolAccess): number => toolAccessLevels.indexOf(access);

// Filter custom tools to those at or below the given access level
const resolveTools = (allTools: readonly Tool[], access: ToolAccess): Tool[] => {
  const max = accessIndex(access);
  return allTools.filter((t) => accessIndex(t.access) <= max);
};

export type { ToolAccess, Tool };
export { toolAccessLevels, builtinToolsByAccess, defineTool, resolveTools };
