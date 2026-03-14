import type { Selectable } from 'kysely';

import { DatabaseService } from '../database/database.js';
import type { Services } from '../services/services.js';
import type { StageConfigsTable } from '../database/database.js';

import type { UpsertStageConfigInput } from './stage-configs.schemas.js';

type StageConfig = Selectable<StageConfigsTable>;

const parseJsonArray = (value: string | null): string[] | null => {
  if (value === null) {
    return null;
  }
  return JSON.parse(value) as string[];
};

type ParsedStageConfig = Omit<
  StageConfig,
  'allowed_kube_contexts' | 'allowed_ssh_connections' | 'allowed_git_repos' | 'allowed_argocd_instances'
> & {
  allowed_kube_contexts: string[] | null;
  allowed_ssh_connections: string[] | null;
  allowed_git_repos: string[] | null;
  allowed_argocd_instances: string[] | null;
};

const parseRow = (row: StageConfig): ParsedStageConfig => ({
  ...row,
  allowed_kube_contexts: parseJsonArray(row.allowed_kube_contexts),
  allowed_ssh_connections: parseJsonArray(row.allowed_ssh_connections),
  allowed_git_repos: parseJsonArray(row.allowed_git_repos),
  allowed_argocd_instances: parseJsonArray(row.allowed_argocd_instances),
});

class StageConfigService {
  #services: Services;

  constructor(services: Services) {
    this.#services = services;
  }

  list = async (): Promise<ParsedStageConfig[]> => {
    const db = await this.#services.get(DatabaseService).instance;

    const rows = await db.selectFrom('stage_configs').selectAll().orderBy('stage', 'asc').execute();

    return rows.map(parseRow);
  };

  getByStage = async (stage: string): Promise<ParsedStageConfig | undefined> => {
    const db = await this.#services.get(DatabaseService).instance;

    const row = await db.selectFrom('stage_configs').selectAll().where('stage', '=', stage).executeTakeFirst();

    return row ? parseRow(row) : undefined;
  };

  upsert = async (input: UpsertStageConfigInput): Promise<ParsedStageConfig> => {
    const db = await this.#services.get(DatabaseService).instance;
    const now = new Date().toISOString();

    const values = {
      id: crypto.randomUUID(),
      stage: input.stage,
      allowed_kube_contexts: input.allowedKubeContexts ? JSON.stringify(input.allowedKubeContexts) : null,
      allowed_ssh_connections: input.allowedSshConnections ? JSON.stringify(input.allowedSshConnections) : null,
      allowed_git_repos: input.allowedGitRepos ? JSON.stringify(input.allowedGitRepos) : null,
      allowed_argocd_instances: input.allowedArgocdInstances ? JSON.stringify(input.allowedArgocdInstances) : null,
      ssh_identity_id: input.sshIdentityId,
      additional_system_prompt: input.additionalSystemPrompt,
      created_at: now,
      updated_at: now,
    };

    await db
      .insertInto('stage_configs')
      .values(values)
      .onConflict((oc) =>
        oc.column('stage').doUpdateSet({
          allowed_kube_contexts: values.allowed_kube_contexts,
          allowed_ssh_connections: values.allowed_ssh_connections,
          allowed_git_repos: values.allowed_git_repos,
          allowed_argocd_instances: values.allowed_argocd_instances,
          ssh_identity_id: values.ssh_identity_id,
          additional_system_prompt: values.additional_system_prompt,
          updated_at: now,
        }),
      )
      .execute();

    const row = await db
      .selectFrom('stage_configs')
      .selectAll()
      .where('stage', '=', input.stage)
      .executeTakeFirstOrThrow();

    return parseRow(row);
  };

  delete = async (stage: string): Promise<boolean> => {
    const db = await this.#services.get(DatabaseService).instance;

    const result = await db.deleteFrom('stage_configs').where('stage', '=', stage).execute();

    return result.length > 0;
  };
}

export type { StageConfig, ParsedStageConfig };
export { StageConfigService };
