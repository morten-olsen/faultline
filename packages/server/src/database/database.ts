import { Kysely, Migrator, SqliteDialect } from "kysely";
import BetterSqlite3 from "better-sqlite3";

import { destroy } from "../services/services.js";
import * as m001 from "./migrations/001-create-issues.js";

import type { Generated } from "kysely";
import type { MigrationProvider } from "kysely";
import type { Services } from "../services/services.js";

type IssuesTable = {
  id: string;
  fingerprint: string;
  source: string;
  title: string;
  description: string | null;
  status: Generated<string>;
  priority: Generated<string>;
  source_payload: string | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
};

type IssueEventsTable = {
  id: string;
  issue_id: string;
  actor: string;
  event_type: string;
  data: string | null;
  created_at: Generated<string>;
};

type LabelsTable = {
  id: string;
  name: string;
};

type IssueLabelsTable = {
  issue_id: string;
  label_id: string;
};

type IssueLinksTable = {
  id: string;
  issue_id: string;
  url: string;
  link_type: string;
  title: string | null;
  description: string | null;
  repo: string;
  created_at: Generated<string>;
};

type DatabaseSchema = {
  issues: IssuesTable;
  issue_events: IssueEventsTable;
  labels: LabelsTable;
  issue_labels: IssueLabelsTable;
  issue_links: IssueLinksTable;
};

const migrationProvider: MigrationProvider = {
  getMigrations: async () => ({
    "001-create-issues": m001,
  }),
};

class DatabaseService {
  #instance: Promise<Kysely<DatabaseSchema>> | undefined;

  constructor(_services: Services) {}

  #setup = async (): Promise<Kysely<DatabaseSchema>> => {
    const dialect = new SqliteDialect({
      database: new BetterSqlite3("faultline.db"),
    });

    const db = new Kysely<DatabaseSchema>({ dialect });

    const migrator = new Migrator({ db, provider: migrationProvider });
    const { error } = await migrator.migrateToLatest();

    if (error) {
      throw error;
    }

    return db;
  };

  get instance(): Promise<Kysely<DatabaseSchema>> {
    if (!this.#instance) {
      this.#instance = this.#setup();
    }
    return this.#instance;
  }

  [destroy] = async (): Promise<void> => {
    if (this.#instance) {
      const db = await this.#instance;
      await db.destroy();
    }
  };
}

export type {
  DatabaseSchema,
  IssuesTable,
  IssueEventsTable,
  LabelsTable,
  IssueLabelsTable,
  IssueLinksTable,
};
export { DatabaseService };
