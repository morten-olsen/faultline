import { IntegrationService } from "../integrations/integrations.js";
import { StageConfigService } from "../stage-configs/stage-configs.js";
import { createFaultlineTools } from "../agent/agent.tools.faultline.js";
import { createInfraTools, buildIntegrationSummary } from "../agent/agent.tools.infra.js";
import { builtinToolsByAccess, resolveTools } from "../agent/agent.tools.js";
import { createScopedIntegrationService } from "../agent/agent.integrations.js";
import { resolveAccess } from "./orchestrator.tools.js";

import type { Services } from "../services/services.js";
import type { IntegrationReader } from "../agent/agent.integrations.js";
import type { Tool } from "../agent/agent.tools.js";

type AgentTaskConfig = {
  builtinTools: readonly string[];
  customTools: Tool[];
  systemPrompt: string;
  cleanup?: () => void;
};

const buildAgentTaskConfig = async (
  services: Services,
  stage: string,
  baseSystemPrompt?: string,
): Promise<AgentTaskConfig> => {
  const stageConfig = await services
    .get(StageConfigService)
    .getByStage(stage);

  let integrations: IntegrationReader = services.get(IntegrationService);

  if (stageConfig) {
    integrations = createScopedIntegrationService(integrations, {
      allowedKubeContexts: stageConfig.allowed_kube_contexts,
      allowedSshConnections: stageConfig.allowed_ssh_connections,
      allowedGitRepos: stageConfig.allowed_git_repos,
      allowedArgocdInstances: stageConfig.allowed_argocd_instances,
      sshIdentityId: stageConfig.ssh_identity_id,
    });
  }

  const { tools: infraTools, cleanup } = createInfraTools(integrations);
  const access = resolveAccess(stage);
  const allCustomTools = [...createFaultlineTools(services), ...infraTools];
  const customTools = resolveTools(allCustomTools, access);
  const builtinTools = builtinToolsByAccess[access];

  const infraSummary = await buildIntegrationSummary(integrations);
  let systemPrompt = baseSystemPrompt
    ? `${baseSystemPrompt}\n\n${infraSummary}`
    : infraSummary;

  if (stageConfig?.additional_system_prompt) {
    systemPrompt = `${systemPrompt}\n\n${stageConfig.additional_system_prompt}`;
  }

  return { builtinTools, customTools, systemPrompt, cleanup };
};

export type { AgentTaskConfig };
export { buildAgentTaskConfig };
