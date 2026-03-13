import { type Kysely, sql } from "kysely";

const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .alterTable("issues")
    .addColumn("monitor_plan", "text")
    .execute();

  await db.schema
    .alterTable("issues")
    .addColumn("monitor_interval_minutes", "integer")
    .execute();

  await db.schema
    .alterTable("issues")
    .addColumn("monitor_next_check_at", "text")
    .execute();

  await db.schema
    .alterTable("issues")
    .addColumn("monitor_until", "text")
    .execute();

  await db.schema
    .alterTable("issues")
    .addColumn("monitor_checks_completed", "integer", (col) =>
      col.defaultTo(0),
    )
    .execute();

  await db.schema
    .alterTable("approvals")
    .addColumn("decision_reason", "text")
    .execute();
};

const down = async (db: Kysely<unknown>): Promise<void> => {
  // SQLite doesn't support DROP COLUMN in older versions,
  // but Kysely handles it via table recreation if needed.
  await db.schema.alterTable("issues").dropColumn("monitor_plan").execute();
  await db.schema.alterTable("issues").dropColumn("monitor_interval_minutes").execute();
  await db.schema.alterTable("issues").dropColumn("monitor_next_check_at").execute();
  await db.schema.alterTable("issues").dropColumn("monitor_until").execute();
  await db.schema.alterTable("issues").dropColumn("monitor_checks_completed").execute();
  await db.schema.alterTable("approvals").dropColumn("decision_reason").execute();
};

export { up, down };
