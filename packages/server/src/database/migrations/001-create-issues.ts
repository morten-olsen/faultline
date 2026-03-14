import { type Kysely, sql } from 'kysely';

const up = async (db: Kysely<unknown>): Promise<void> => {
  // ── Issues ──────────────────────────────────────────────────────────
  await db.schema
    .createTable('issues')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('fingerprint', 'text', (col) => col.notNull())
    .addColumn('source', 'text', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('summary', 'text')
    .addColumn('description', 'text')
    .addColumn('stage', 'text', (col) => col.notNull().defaultTo('triage'))
    .addColumn('needs_you', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('priority', 'text', (col) => col.notNull().defaultTo('medium'))
    .addColumn('source_payload', 'text')
    .addColumn('resolved_at', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addUniqueConstraint('uq_issues_fingerprint_source', ['fingerprint', 'source'])
    .execute();

  await db.schema.createIndex('idx_issues_stage').on('issues').column('stage').execute();

  await db.schema.createIndex('idx_issues_needs_you').on('issues').column('needs_you').execute();

  await db.schema.createIndex('idx_issues_source').on('issues').column('source').execute();

  await db.schema.createIndex('idx_issues_created_at').on('issues').column('created_at').execute();

  // ── Labels ──────────────────────────────────────────────────────────
  await db.schema
    .createTable('labels')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .execute();

  await db.schema
    .createTable('issue_labels')
    .addColumn('issue_id', 'text', (col) => col.notNull().references('issues.id'))
    .addColumn('label_id', 'text', (col) => col.notNull().references('labels.id'))
    .addPrimaryKeyConstraint('pk_issue_labels', ['issue_id', 'label_id'])
    .execute();

  // ── Timeline entries ────────────────────────────────────────────────
  // The high-level story of an issue: detected → analysis → action → outcome → resolved
  await db.schema
    .createTable('timeline_entries')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('issue_id', 'text', (col) => col.notNull().references('issues.id'))
    .addColumn('agent_loop_id', 'text')
    .addColumn('kind', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('info'))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('body', 'text')
    .addColumn('command_run', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema
    .createIndex('idx_timeline_entries_issue_id_created_at')
    .on('timeline_entries')
    .columns(['issue_id', 'created_at'])
    .execute();

  // ── Agent loops ─────────────────────────────────────────────────────
  // A work session: one agent investigating or fixing one issue
  await db.schema
    .createTable('agent_loops')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('issue_id', 'text', (col) => col.notNull().references('issues.id'))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('running'))
    .addColumn('started_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('finished_at', 'text')
    .execute();

  await db.schema.createIndex('idx_agent_loops_issue_id').on('agent_loops').column('issue_id').execute();

  await db.schema.createIndex('idx_agent_loops_status').on('agent_loops').column('status').execute();

  // Add FK for timeline_entries.agent_loop_id now that agent_loops exists
  // SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we rely on
  // application-level enforcement. The column was created without a
  // reference above to avoid circular table creation issues.

  // ── Agent steps ─────────────────────────────────────────────────────
  // Individual transcript entries within an agent loop
  await db.schema
    .createTable('agent_steps')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('agent_loop_id', 'text', (col) => col.notNull().references('agent_loops.id'))
    .addColumn('kind', 'text', (col) => col.notNull())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('status', 'text')
    .addColumn('detail', 'text')
    .addColumn('output', 'text')
    .addColumn('duration_ms', 'integer')
    .addColumn('sequence', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema
    .createIndex('idx_agent_steps_loop_sequence')
    .on('agent_steps')
    .columns(['agent_loop_id', 'sequence'])
    .execute();

  // ── Issue resources ─────────────────────────────────────────────────
  // Infrastructure resources involved in an issue
  await db.schema
    .createTable('issue_resources')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('issue_id', 'text', (col) => col.notNull().references('issues.id'))
    .addColumn('kind', 'text', (col) => col.notNull())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('health', 'text', (col) => col.notNull().defaultTo('healthy'))
    .addColumn('detail', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema.createIndex('idx_issue_resources_issue_id').on('issue_resources').column('issue_id').execute();

  // ── Issue relations ─────────────────────────────────────────────────
  // Directed links between issues: "A caused B", "A related to B"
  await db.schema
    .createTable('issue_relations')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('source_issue_id', 'text', (col) => col.notNull().references('issues.id'))
    .addColumn('target_issue_id', 'text', (col) => col.notNull().references('issues.id'))
    .addColumn('relation', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema.createIndex('idx_issue_relations_source').on('issue_relations').column('source_issue_id').execute();

  await db.schema.createIndex('idx_issue_relations_target').on('issue_relations').column('target_issue_id').execute();

  // ── Approvals ───────────────────────────────────────────────────────
  // Pending human decisions — tied to an issue and optionally an agent loop
  await db.schema
    .createTable('approvals')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('issue_id', 'text', (col) => col.notNull().references('issues.id'))
    .addColumn('agent_loop_id', 'text', (col) => col.references('agent_loops.id'))
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('reason', 'text', (col) => col.notNull())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('pending'))
    .addColumn('decided_at', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema.createIndex('idx_approvals_issue_id').on('approvals').column('issue_id').execute();

  await db.schema.createIndex('idx_approvals_status').on('approvals').column('status').execute();

  // ── Issue links ─────────────────────────────────────────────────────
  // External evidence: commits, PRs
  await db.schema
    .createTable('issue_links')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('issue_id', 'text', (col) => col.notNull().references('issues.id'))
    .addColumn('url', 'text', (col) => col.notNull())
    .addColumn('link_type', 'text', (col) => col.notNull())
    .addColumn('title', 'text')
    .addColumn('description', 'text')
    .addColumn('repo', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  await db.schema.createIndex('idx_issue_links_issue_id').on('issue_links').column('issue_id').execute();
};

const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable('issue_links').execute();
  await db.schema.dropTable('approvals').execute();
  await db.schema.dropTable('issue_relations').execute();
  await db.schema.dropTable('issue_resources').execute();
  await db.schema.dropTable('agent_steps').execute();
  await db.schema.dropTable('agent_loops').execute();
  await db.schema.dropTable('timeline_entries').execute();
  await db.schema.dropTable('issue_labels').execute();
  await db.schema.dropTable('labels').execute();
  await db.schema.dropTable('issues').execute();
};

export { up, down };
