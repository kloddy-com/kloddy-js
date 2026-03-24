import { KloddyClient } from './client';
import { EvaluationOptions, EvaluationResult, KloddyOptions } from './types';

/**
 * Manager for Kloddy evaluations.
 * Allows running and retrieving model comparisons.
 */
export class Evaluations {
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
   * Run or retrieve an evaluation.
   * 
   * @param options Evaluation criteria including models, judge, and variables.
   */
  async run(options: EvaluationOptions): Promise<EvaluationResult> {
    return this.client.request<EvaluationResult>('/api/evaluate', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Alias for run().
   * 
   * @param options Evaluation criteria.
   */
  async evaluate(options: EvaluationOptions): Promise<EvaluationResult> {
    return this.run(options);
  }

  /**
   * Simple one-step evaluation call.
   * 
   * @param name The name of the evaluation to run.
   * @param variables Variables to inject into the evaluation.
   */
  async get(name: string, variables: Record<string, any> = {}): Promise<EvaluationResult> {
    return this.run({ name, variables });
  }
}
