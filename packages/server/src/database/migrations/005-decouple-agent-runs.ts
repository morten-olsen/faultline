import { type Kysely, sql } from "kysely";

const up = async (db: Kysely<unknown>): Promise<void> => {
  // Create join table
  await db.schema
    .createTable("issue_agent_runs")
    .addColumn("issue_id", "text", (col) =>
      col.notNull().references("issues.id"),
    )
    .addColumn("agent_loop_id", "text", (col) =>
      col.notNull().references("agent_loops.id"),
    )
    .addPrimaryKeyConstraint("pk_issue_agent_runs", [
      "issue_id",
      "agent_loop_id",
    ])
    .execute();

  await db.schema
    .createIndex("idx_issue_agent_runs_issue_id")
    .on("issue_agent_runs")
    .column("issue_id")
    .execute();

  await db.schema
    .createIndex("idx_issue_agent_runs_agent_loop_id")
    .on("issue_agent_runs")
    .column("agent_loop_id")
    .execute();

  // Populate from existing data
  await sql`INSERT INTO issue_agent_runs (issue_id, agent_loop_id) SELECT issue_id, id FROM agent_loops`.execute(db);

  // Recreate agent_loops without issue_id
  await sql`PRAGMA foreign_keys = OFF`.execute(db);

  await db.schema.alterTable("agent_loops").renameTo("agent_loops_old").execute();

  await db.schema
    .createTable("agent_loops")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("status", "text", (col) => col.notNull().defaultTo("running"))
    .addColumn("started_at", "text", (col) =>
      col.notNull().defaultTo(sql`(datetime('now'))`),
    )
    .addColumn("finished_at", "text")
    .execute();

  await sql`INSERT INTO agent_loops (id, title, status, started_at, finished_at) SELECT id, title, status, started_at, finished_at FROM agent_loops_old`.execute(db);

  await db.schema
    .createIndex("idx_agent_loops_status")
    .on("agent_loops")
    .column("status")
    .execute();

  await db.schema.dropTable("agent_loops_old").execute();

  // Drop the old issue-scoped index (no longer relevant)
  // idx_agent_loops_issue_id was on the old table and is already gone

  await sql`PRAGMA foreign_keys = ON`.execute(db);
};

const down = async (db: Kysely<unknown>): Promise<void> => {
  await sql`PRAGMA foreign_keys = OFF`.execute(db);

  // Recreate agent_loops with issue_id
  await db.schema.alterTable("agent_loops").renameTo("agent_loops_new").execute();

  await db.schema
    .createTable("agent_loops")
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("issue_id", "text", (col) =>
      col.notNull().references("issues.id"),
    )
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("status", "text", (col) => col.notNull().defaultTo("running"))
    .addColumn("started_at", "text", (col) =>
      col.notNull().defaultTo(sql`(datetime('now'))`),
    )
    .addColumn("finished_at", "text")
    .execute();

  await sql`INSERT INTO agent_loops (id, issue_id, title, status, started_at, finished_at) SELECT al.id, iar.issue_id, al.title, al.status, al.started_at, al.finished_at FROM agent_loops_new al JOIN issue_agent_runs iar ON iar.agent_loop_id = al.id`.execute(db);

  await db.schema
    .createIndex("idx_agent_loops_issue_id")
    .on("agent_loops")
    .column("issue_id")
    .execute();

  await db.schema
    .createIndex("idx_agent_loops_status")
    .on("agent_loops")
    .column("status")
    .execute();

  await db.schema.dropTable("agent_loops_new").execute();
  await db.schema.dropTable("issue_agent_runs").execute();

  await sql`PRAGMA foreign_keys = ON`.execute(db);
};

export { up, down };
