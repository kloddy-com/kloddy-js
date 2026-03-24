import fetch from 'cross-fetch';
import { KloddyOptions, AuthResponse, User, Organization, Feature } from './types';

export class KloddyClient {
  private apiKey: string;
  private apiSecret: string;
  private host: string;
  public defaultOrgId: string | null = null;
  public defaultFeatureId: string | null = null;
  private token: string | null = null;
  private tokenExpires: number | null = null;

  constructor(apiKeyOrOptions: string | KloddyOptions, options?: KloddyOptions) {
    if (typeof apiKeyOrOptions === 'string') {
      this.apiKey = apiKeyOrOptions;
      this.apiSecret = options?.apiSecret || options?.personalApiKey || options?.secretKey || '';
      this.token = options?.token || null;
      this.host = options?.host || 'https://api.kloddy.com';
      this.defaultOrgId = options?.defaultOrgId || null;
      this.defaultFeatureId = options?.defaultFeatureId || null;
    } else {
      this.apiKey = apiKeyOrOptions.apiKey || apiKeyOrOptions.projectApiKey || apiKeyOrOptions.applicationId || '';
      this.apiSecret = apiKeyOrOptions.apiSecret || apiKeyOrOptions.personalApiKey || apiKeyOrOptions.secretKey || '';
      this.token = apiKeyOrOptions.token || null;
      this.host = apiKeyOrOptions.host || 'https://api.kloddy.com';
      this.defaultOrgId = apiKeyOrOptions.defaultOrgId || null;
      this.defaultFeatureId = apiKeyOrOptions.defaultFeatureId || null;
    }

    if (!this.token && (!this.apiKey || !this.apiSecret)) {
      console.warn('KloddyClient: token or credentials missing. API calls will fail.');
    }
  }

  async login(): Promise<string> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('KloddyClient: Cannot login without apiKey and apiSecret.');
    }
    
    const response = await fetch(`${this.host}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: this.apiKey,
        secretKey: this.apiSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kloddy Auth failed: ${response.status} ${error}`);
    }

    const data = (await response.json()) as AuthResponse;
    this.token = data.token;
    // Set expiry to 1 hour from now as a fallback if not provided
    this.tokenExpires = Date.now() + (data.expiresAt ? new Date(data.expiresAt).getTime() - Date.now() : 3600000);
    
    return this.token;
  }

  async getToken(): Promise<string> {
    // If we have a static token (passed in constructor) and no secretKey, don't try to refresh
    if (this.token && !this.apiSecret) {
      return this.token;
    }

    if (!this.token || (this.tokenExpires && Date.now() >= this.tokenExpires - 60000)) {
      return this.login();
    }
    return this.token;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const url = path.startsWith('http') ? path : `${this.host}${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kloddy API error: ${response.status} ${error}`);
    }

    return (await response.json()) as T;
  }

  /**
   * Get current user information.
   */
  async whoAmI(): Promise<User> {
    return this.request<User>('/api/whoiam');
  }

  /**
   * List organizations for the current user.
   */
  async listOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>('/api/organizations');
  }

  /**
   * List features, optionally filtered by organization.
   */
  async listFeatures(orgId?: string): Promise<Feature[]> {
    const path = orgId ? `/api/features?org_id=${orgId}` : '/api/features';
    return this.request<Feature[]>(path);
  }
}
