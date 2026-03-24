export * from './types';
export * from './client';
export * from './prompts';
export * from './evaluations';
export * from './errors';
export * from './libs/react';

import { KloddyClient } from './client';
import { Prompts } from './prompts';
import { Evaluations } from './evaluations';
import { KloddyOptions } from './types';

/**
 * The main Kloddy SDK class.
 * Provides access to prompts, evaluations, and account management.
 * 
 * @template TPromptNames Union of strings representing available prompt names for type safety.
 */
export class Kloddy<TPromptNames extends string = string> {
  public client: KloddyClient;
  public prompts: Prompts<TPromptNames>;
  public evaluations: Evaluations;

  /**
   * Initialize the Kloddy SDK.
   * If no arguments are provided, it will attempt to use KLODDY_API_KEY and KLODDY_API_SECRET from process.env.
   */
  constructor(apiKeyOrOptions?: string | KloddyOptions, options?: KloddyOptions) {
    this.client = new KloddyClient(apiKeyOrOptions, options);
    this.prompts = new Prompts<TPromptNames>({ client: this.client });
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
  async listFeatures(orgId?: string) {
    return this.client.listFeatures(orgId);
  }
}

export default Kloddy;
