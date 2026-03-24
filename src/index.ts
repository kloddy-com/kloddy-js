export * from './types';
export * from './client';
export * from './prompts';
export * from './evaluations';
export * from './hooks/use-prompt';

import { KloddyClient } from './client';
import { Prompts } from './prompts';
import { Evaluations } from './evaluations';
import { KloddyOptions } from './types';

export class Kloddy {
  public client: KloddyClient;
  public prompts: Prompts;
  public evaluations: Evaluations;

  constructor(apiKeyOrOptions: string | KloddyOptions, options?: KloddyOptions) {
    this.client = new KloddyClient(apiKeyOrOptions, options);
    this.prompts = new Prompts({ posthog: this.client });
    this.evaluations = new Evaluations({ posthog: this.client });
  }

  async whoAmI() {
    return this.client.whoAmI();
  }

  async listOrganizations() {
    return this.client.listOrganizations();
  }

  async listFeatures(orgId?: string) {
    return this.client.listFeatures(orgId);
  }
}

export default Kloddy;
