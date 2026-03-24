import { KloddyClient } from './client';
import { PromptOptions, PromptTemplate, ExecuteOptions, ExecuteResult, KloddyOptions, PromptListOptions } from './types';

/**
 * Manager for Kloddy prompts.
 * 
 * @template TPromptNames Union of strings representing available prompt names for type safety.
 */
export class Prompts<TPromptNames extends string = string> {
  private client: KloddyClient;

  constructor(options: { client?: KloddyClient } | KloddyOptions) {
    if ('client' in options && options.client) {
      this.client = options.client;
    } else if ('posthog' in options && (options as any).posthog) {
      this.client = (options as any).posthog;
    } else {
      this.client = new KloddyClient(options as KloddyOptions);
    }
  }

  /**
   * List prompts with filters.
   */
  async list(options: PromptListOptions = {}): Promise<PromptTemplate[]> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.pageSize) params.append('pageSize', options.pageSize.toString());
    if (options.name) params.append('name', options.name);
    
    const orgId = options.org_id || this.client.defaultOrgId;
    if (orgId) params.append('org_id', orgId);
    
    const featureId = options.feature_id || this.client.defaultFeatureId;
    if (featureId) params.append('feature_id', featureId);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.client.request<PromptTemplate[]>(`/api/prompts${queryString}`);
  }

  /**
   * Fetch a prompt template.
   * 
   * @param name The unique name of the prompt.
   * @param options Fetching options (version, fallback, etc.)
   */
  async get(name: TPromptNames, options?: PromptOptions): Promise<PromptTemplate> {
    const params = new URLSearchParams();
    if (options?.version) params.append('version', options.version.toString());
    
    // Default resolve to true if not specified
    const resolve = options?.resolve !== undefined ? options.resolve : true;
    params.append('resolve', resolve.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    try {
      const template = await this.client.request<PromptTemplate>(`/api/prompt/${name}${queryString}`, {
        method: 'GET',
      });

      return template;
    } catch (error) {
      if (options?.fallback) {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.warn(`Kloddy SDK: Prompt '${name}' not found, using provided fallback.`);
        }
        return {
          id: 'fallback',
          name,
          content: options.fallback,
          version: 0,
        };
      }
      throw error;
    }
  }

  /**
   * Execute a prompt via the Kloddy API.
   * 
   * @param name The unique name of the prompt.
   * @param options Execution variables and model overrides.
   */
  async execute(name: TPromptNames, options: ExecuteOptions = {}): Promise<ExecuteResult> {
    return this.client.request<ExecuteResult>(`/api/prompt/${name}`, {
      method: 'POST',
      body: JSON.stringify({
        ...options,
        resolve: options.resolve !== undefined ? options.resolve : true,
      }),
    });
  }

  /**
   * Play: Direct execution for a single model/version.
   * Same as execute but follows specific naming/body requirements.
   * 
   * @param name The unique name of the prompt.
   * @param options Execution variables and model overrides.
   */
  async play(name: TPromptNames, options: Omit<ExecuteOptions, 'judge' | 'evaluate_id'> = {}): Promise<ExecuteResult> {
    return this.client.request<ExecuteResult>('/api/play', {
      method: 'POST',
      body: JSON.stringify({
        name,
        ...options,
        resolve: options.resolve !== undefined ? options.resolve : true,
      }),
    });
  }

  /**
   * Update: Download all prompts for the user/organization.
   */
  async update(options: PromptListOptions = {}): Promise<PromptTemplate[]> {
    return this.list(options);
  }

  /**
   * Local compilation of a template string with variables.
   * 
   * @param template The template string or PromptTemplate object.
   * @param variables Dictionary of variables to inject (e.g., {{variable}}).
   */
  compile(template: string | PromptTemplate, variables: Record<string, any>): string {
    let content = typeof template === 'string' ? template : template.content;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}|{${key}}`, 'g');
      content = content.replace(regex, String(value));
    }
    
    return content;
  }
}
