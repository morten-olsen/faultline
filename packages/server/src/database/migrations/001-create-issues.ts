import { type Kysely, sql } from "kysely";

const up = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema
    .createTable("issues")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("fingerprint", "text", (col) => col.notNull())
    .addColumn("source", "text", (col) => col.notNull())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("status", "text", (col) => col.notNull().defaultTo("triage"))
    .addColumn("priority", "text", (col) => col.notNull().defaultTo("medium"))
    .addColumn("source_payload", "text")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`(datetime('now'))`),
    )
    .addColumn("updated_at", "text", (col) =>
      col.notNull().defaultTo(sql`(datetime('now'))`),
    )
    .addUniqueConstraint("uq_issues_fingerprint_source", [
      "fingerprint",
      "source",
    ])
    .execute();

  await db.schema
    .createIndex("idx_issues_status")
    .on("issues")
    .column("status")
    .execute();

  await db.schema
    .createIndex("idx_issues_source")
    .on("issues")
    .column("source")
    .execute();

  await db.schema
    .createIndex("idx_issues_created_at")
    .on("issues")
    .column("created_at")
    .execute();

  await db.schema
    .createTable("issue_events")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("issue_id", "text", (col) =>
      col.notNull().references("issues.id"),
    )
    .addColumn("actor", "text", (col) => col.notNull())
    .addColumn("event_type", "text", (col) => col.notNull())
    .addColumn("data", "text")
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`(datetime('now'))`),
    )
    .execute();

  await db.schema
    .createIndex("idx_issue_events_issue_id_created_at")
    .on("issue_events")
    .columns(["issue_id", "created_at"])
    .execute();

  await db.schema
    .createTable("labels")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull().unique())
    .execute();

  await db.schema
    .createTable("issue_labels")
    .addColumn("issue_id", "text", (col) =>
      col.notNull().references("issues.id"),
    )
    .addColumn("label_id", "text", (col) =>
      col.notNull().references("labels.id"),
    )
    .addPrimaryKeyConstraint("pk_issue_labels", ["issue_id", "label_id"])
    .execute();

  await db.schema
    .createTable("issue_links")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("issue_id", "text", (col) =>
      col.notNull().references("issues.id"),
    )
    .addColumn("url", "text", (col) => col.notNull())
    .addColumn("link_type", "text", (col) => col.notNull())
    .addColumn("title", "text")
    .addColumn("description", "text")
    .addColumn("repo", "text", (col) => col.notNull())
    .addColumn("created_at", "text", (col) =>
      col.notNull().defaultTo(sql`(datetime('now'))`),
    )
    .execute();

  await db.schema
    .createIndex("idx_issue_links_issue_id")
    .on("issue_links")
    .column("issue_id")
    .execute();
};

const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable("issue_links").execute();
  await db.schema.dropTable("issue_labels").execute();
  await db.schema.dropTable("labels").execute();
  await db.schema.dropTable("issue_events").execute();
  await db.schema.dropTable("issues").execute();
};

export { up, down };
