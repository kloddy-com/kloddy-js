import { KloddyClient } from './client';
import { EvaluationOptions, EvaluationResult, KloddyOptions } from './types';

export class Evaluations {
  private client: KloddyClient;

  constructor(options: { posthog?: KloddyClient } | KloddyOptions) {
    if ('posthog' in options && options.posthog) {
      this.client = options.posthog as KloddyClient;
    } else {
      this.client = new KloddyClient(options as KloddyOptions);
    }
  }

  /**
   * Run or retrieve an evaluation.
   */
  async run(options: EvaluationOptions): Promise<EvaluationResult> {
    return this.client.request<EvaluationResult>('/api/evaluate', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Alias for run() as requested.
   */
  async evaluate(options: EvaluationOptions): Promise<EvaluationResult> {
    return this.run(options);
  }

  /**
   * Legacy alias for run(name) as requested in the hook example.
   */
  async get(name: string, variables: Record<string, any> = {}): Promise<EvaluationResult> {
    return this.run({ name, variables });
  }
}
