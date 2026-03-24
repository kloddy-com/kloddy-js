export interface KloddyOptions {
  apiKey?: string;
  apiSecret?: string;
  token?: string; // Pre-authenticated token for client-side use
  personalApiKey?: string; // Alias for apiSecret
  projectApiKey?: string;  // Alias for apiKey
  applicationId?: string; // Internal term
  secretKey?: string;     // Internal term
  host?: string;
  cacheTtlSeconds?: number;
  defaultOrgId?: string;
  defaultFeatureId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

export interface Organization {
  id: string;
  name: string;
  [key: string]: any;
}

export interface Feature {
  id: string;
  name: string;
  org_id: string;
  [key: string]: any;
}

export interface PromptListOptions {
  page?: number;
  pageSize?: number;
  name?: string;
  org_id?: string;
  feature_id?: string;
}

export interface PromptOptions {
  version?: number | string;
  fallback?: string;
  cacheTtlSeconds?: number;
  resolve?: boolean; // Default: true. Resolve @mentions.
}

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  version: number;
  variables?: string[];
  [key: string]: any;
}

export interface ExecuteOptions {
  variables?: Record<string, any>;
  model?: string; // Should be a string for 'play'
  version?: string | number;
  resolve?: boolean;
}

export interface ExecuteResult {
  result: string;
  model: string;
  version: string | number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface EvaluationOptions {
  name: string;
  models?: string[];
  judge?: string; // Could be prompt_id or preset
  version?: (string | number)[]; // Array for evaluations
  variables?: Record<string, any>;
  evaluate_id?: string;
  temperature?: number;
}

export interface EvaluationResult {
  result: string;
  winner?: string;
  answers: {
    model: string;
    answer: string;
    score?: number;
  }[];
}

export interface AuthResponse {
  token: string;
  expiresAt?: string;
}
