import fetch from 'cross-fetch';
import { KloddyOptions, AuthResponse, User, Organization, Feature } from './types';
import { KloddyAuthError, KloddyError, KloddyNotFoundError, KloddyRateLimitError } from './errors';

/**
 * Low-level client for interacting with the Kloddy API.
 * Handles authentication, token management, and raw requests.
 */
export class KloddyClient {
  private apiKey: string;
  private apiSecret: string;
  private host: string;
  public defaultOrgId: string | null = null;
  public defaultFeatureId: string | null = null;
  private token: string | null = null;
  private tokenExpires: number | null = null;

  /**
   * Initialize a new KloddyClient.
   * If no credentials are provided, it will look for:
   * - KLODDY_API_KEY / KLODDY_APP_ID
   * - KLODDY_API_SECRET / KLODDY_SECRET_KEY
   * in process.env.
   */
  constructor(apiKeyOrOptions?: string | KloddyOptions, options?: KloddyOptions) {
    const envApiKey = typeof process !== 'undefined' ? process.env?.KLODDY_API_KEY || process.env?.KLODDY_APP_ID || '' : '';
    const envApiSecret = typeof process !== 'undefined' ? process.env?.KLODDY_API_SECRET || process.env?.KLODDY_SECRET_KEY || '' : '';

    if (!apiKeyOrOptions || apiKeyOrOptions === '') {
      this.apiKey = envApiKey;
      this.apiSecret = envApiSecret;
      this.host = 'https://api.kloddy.com';
    } else if (typeof apiKeyOrOptions === 'string') {
      this.apiKey = apiKeyOrOptions;
      this.apiSecret = options?.apiSecret || options?.personalApiKey || options?.secretKey || envApiSecret || '';
      this.token = options?.token || null;
      this.host = options?.host || 'https://api.kloddy.com';
      this.defaultOrgId = options?.defaultOrgId || null;
      this.defaultFeatureId = options?.defaultFeatureId || null;
    } else {
      this.apiKey = apiKeyOrOptions.apiKey || apiKeyOrOptions.projectApiKey || apiKeyOrOptions.applicationId || envApiKey || '';
      this.apiSecret = apiKeyOrOptions.apiSecret || apiKeyOrOptions.personalApiKey || apiKeyOrOptions.secretKey || envApiSecret || '';
      this.token = apiKeyOrOptions.token || null;
      this.host = apiKeyOrOptions.host || 'https://api.kloddy.com';
      this.defaultOrgId = apiKeyOrOptions.defaultOrgId || null;
      this.defaultFeatureId = apiKeyOrOptions.defaultFeatureId || null;
    }

    if (!this.token && (!this.apiKey || !this.apiSecret)) {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
        console.warn('Kloddy SDK: API Key or Secret missing. Set KLODDY_API_KEY and KLODDY_API_SECRET env vars or pass them to the constructor.');
      }
    }
  }

  /**
   * Authenticate with the Kloddy API and retrieve a session token.
   */
  async login(): Promise<string> {
    if (!this.apiKey || !this.apiSecret) {
      throw new KloddyAuthError('KloddyClient: Cannot login without apiKey and apiSecret.');
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
      const errorContent = await response.text();
      if (response.status === 401) throw new KloddyAuthError(`Authentication failed: ${errorContent}`);
      if (response.status === 429) throw new KloddyRateLimitError(`Rate limit exceeded: ${errorContent}`);
      throw new KloddyError(`Kloddy Auth failed: ${response.status} ${errorContent}`, response.status);
    }

    const data = (await response.json()) as AuthResponse;
    this.token = data.token;
    // Set expiry to 1 hour from now as a fallback if not provided
    this.tokenExpires = Date.now() + (data.expiresAt ? new Date(data.expiresAt).getTime() - Date.now() : 3600000);
    
    return this.token;
  }

  /**
   * Get the current active token, refreshing it if necessary.
   */
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

  /**
   * Make an authenticated request to the Kloddy API.
   */
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
      const errorContent = await response.text();
      if (response.status === 404) throw new KloddyNotFoundError(`Resource not found: ${path}`);
      if (response.status === 401) throw new KloddyAuthError(`Unauthorized: ${errorContent}`);
      if (response.status === 429) throw new KloddyRateLimitError(`Rate limit exceeded: ${errorContent}`);
      throw new KloddyError(`Kloddy API error: ${response.status} ${errorContent}`, response.status);
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
