import { KloddyClient } from './client';
import { PromptOptions, PromptTemplate, ExecuteOptions, ExecuteResult, KloddyOptions } from './types';

export class Prompts {
  private client: KloddyClient;

  constructor(options: { posthog?: KloddyClient } | KloddyOptions) {
    if ('posthog' in options && options.posthog) {
      this.client = options.posthog as KloddyClient;
    } else {
      this.client = new KloddyClient(options as KloddyOptions);
    }
  }

  /**
   * Fetch the latest version of a prompt template.
   */
  async get(name: string, options: PromptOptions = {}): Promise<PromptTemplate> {
    const params = new URLSearchParams();
    if (options.version) params.append('version', options.version.toString());
    if (options.resolve !== undefined) params.append('resolve', options.resolve.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    try {
      const prompt = await this.client.request<PromptTemplate>(`/api/prompt/${name}${queryString}`, {
        method: 'GET',
      });
      return prompt;
    } catch (error) {
      if (options.fallback) {
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
   */
  async execute(name: string, options: ExecuteOptions = {}): Promise<ExecuteResult> {
    return this.client.request<ExecuteResult>(`/api/prompt/${name}`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Local compilation of a template string with variables.
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
