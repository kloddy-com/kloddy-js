import {
  Evaluations,
  KloddyProvider,
  Prompts,
  useEvaluations,
  usePrompt,
  usePromptStream
} from "./chunk-WWAXYTZO.mjs";
import {
  KloddyAuthError,
  KloddyClient,
  KloddyError,
  KloddyNotFoundError,
  KloddyRateLimitError
} from "./chunk-WSN7MLKR.mjs";

// src/index.ts
var Kloddy = class {
  client;
  prompts;
  evaluations;
  /**
   * Initialize the Kloddy SDK.
   * If no arguments are provided, it will attempt to use KLODDY_API_KEY and KLODDY_API_SECRET from process.env.
   */
  constructor(apiKeyOrOptions, options) {
    this.client = new KloddyClient(apiKeyOrOptions, options);
    this.prompts = new Prompts({ client: this.client });
    this.evaluations = new Evaluations({ client: this.client });
  }
  /**
   * Get information about the current authenticated user/application.
   */
  async whoAmI() {
    return this.client.whoAmI();
  }
  /**
   * List organizations accessible by the current credentials.
   */
  async listOrganizations() {
    return this.client.listOrganizations();
  }
  /**
   * List features, optionally filtered by organization.
   */
  async listFeatures(orgId) {
    return this.client.listFeatures(orgId);
  }
};
var index_default = Kloddy;
export {
  Evaluations,
  Kloddy,
  KloddyAuthError,
  KloddyClient,
  KloddyError,
  KloddyNotFoundError,
  KloddyProvider,
  KloddyRateLimitError,
  Prompts,
  index_default as default,
  useEvaluations,
  usePrompt,
  usePromptStream
};
