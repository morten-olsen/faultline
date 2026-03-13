import { type Kysely, sql } from "kysely";

const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("stage_configs")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("stage", "text", (col) => col.notNull().unique())
    .addColumn("allowed_kube_contexts", "text")
    .addColumn("allowed_ssh_connections", "text")
    .addColumn("allowed_git_repos", "text")
    .addColumn("allowed_argocd_instances", "text")
    .addColumn("ssh_identity_id", "text", (col) =>
      col.references("ssh_identities.id"),
    )
    .addColumn("additional_system_prompt", "text")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`(datetime('now'))`),
    )
    .addColumn("updated_at", "text", (col) =>
      col.notNull().defaultTo(sql`(datetime('now'))`),
    )
    .execute();
};

const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable("stage_configs").execute();
};

export { up, down };
