import type { ToolAccess } from '../agent/agent.tools.js';

// ── Issue stage → access level mapping ────────────────────────────

const issueStageAccess: Record<string, ToolAccess> = {
  triage: 'read',
  investigation: 'read',
  'proposed-plan': 'read',
  implementation: 'write',
  monitoring: 'read',
  resolved: 'read',
  ignored: 'read',
};

// Get the access level for an issue stage
const resolveAccess = (stage: string): ToolAccess => issueStageAccess[stage] ?? 'read';

export { issueStageAccess, resolveAccess };
