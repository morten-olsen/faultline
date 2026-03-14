import { type Kysely, sql } from 'kysely';

const up = async (db: Kysely<unknown>): Promise<void> => {
  // ── SSH identities ──────────────────────────────────────────────
  // Keypairs used for git operations, SSH connections, etc.
  // Private key stays on the server, only public key is exposed via API.
  await db.schema
    .createTable('ssh_identities')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('key_type', 'text', (col) => col.notNull().defaultTo('ed25519'))
    .addColumn('public_key', 'text', (col) => col.notNull())
    .addColumn('private_key', 'text', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  // ── Git repositories ────────────────────────────────────────────
  // Repos the agent can clone into its workspace for gitops flows.
  await db.schema
    .createTable('git_repos')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('clone_url', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('ssh_identity_id', 'text', (col) => col.references('ssh_identities.id'))
    .addColumn('default_branch', 'text', (col) => col.notNull().defaultTo('main'))
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  // ── Kubernetes contexts ─────────────────────────────────────────
  // Kubeconfig contexts the agent can use for kubectl commands.
  await db.schema
    .createTable('kube_contexts')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('context', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  // ── ArgoCD instances ────────────────────────────────────────────
  // ArgoCD servers the agent can query and sync.
  await db.schema
    .createTable('argocd_instances')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('server_url', 'text', (col) => col.notNull())
    .addColumn('auth_token', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();

  // ── SSH connections ─────────────────────────────────────────────
  // Remote hosts the agent can SSH into.
  await db.schema
    .createTable('ssh_connections')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .addColumn('host', 'text', (col) => col.notNull())
    .addColumn('port', 'integer', (col) => col.notNull().defaultTo(22))
    .addColumn('username', 'text', (col) => col.notNull())
    .addColumn('ssh_identity_id', 'text', (col) => col.references('ssh_identities.id'))
    .addColumn('description', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .addColumn('updated_at', 'text', (col) => col.notNull().defaultTo(sql`(datetime('now'))`))
    .execute();
};

const down = async (db: Kysely<unknown>): Promise<void> => {
  await db.schema.dropTable('ssh_connections').execute();
  await db.schema.dropTable('argocd_instances').execute();
  await db.schema.dropTable('kube_contexts').execute();
  await db.schema.dropTable('git_repos').execute();
  await db.schema.dropTable('ssh_identities').execute();
};

export { up, down };
