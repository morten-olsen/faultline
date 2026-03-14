import { resolve } from "node:path";

import type { Services } from "../services/services.js";

class ConfigService {
  #dataDir: string;

  constructor(_services: Services) {
    this.#dataDir = resolve(process.env["FAULTLINE_DATA_DIR"] ?? "./data");
  }

  get dataDir(): string {
    return this.#dataDir;
  }

  get dbPath(): string {
    return resolve(this.#dataDir, "faultline.db");
  }

  get workspacesDir(): string {
    return resolve(this.#dataDir, "workspaces");
  }
}

export { ConfigService };
