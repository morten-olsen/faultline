import { IssueService } from '../issues/issues.js';
import type { Services } from '../services/services.js';

import type { Tool } from './agent.tools.js';
import { createReadTools } from './agent.tools.faultline.read.js';
import { createWriteTools } from './agent.tools.faultline.write.js';

// ── Factory ─────────────────────────────────────────────────────────
// All Faultline tools need the service container, so we create them
// via a factory that closes over `services`.

const createFaultlineTools = (services: Services): Tool[] => {
  const issues = (): IssueService => services.get(IssueService);

  return [...createReadTools(issues), ...createWriteTools(issues)];
};

export { createFaultlineTools };
