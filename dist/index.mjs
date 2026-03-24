// src/client.ts
import fetch from "cross-fetch";
var KloddyClient = class {
  apiKey;
  apiSecret;
  host;
  defaultOrgId = null;
  defaultFeatureId = null;
  token = null;
  tokenExpires = null;
  constructor(apiKeyOrOptions, options) {
    if (typeof apiKeyOrOptions === "string") {
      this.apiKey = apiKeyOrOptions;
      this.apiSecret = options?.apiSecret || options?.personalApiKey || options?.secretKey || "";
      this.token = options?.token || null;
      this.host = options?.host || "https://api.kloddy.com";
      this.defaultOrgId = options?.defaultOrgId || null;
      this.defaultFeatureId = options?.defaultFeatureId || null;
    } else {
      this.apiKey = apiKeyOrOptions.apiKey || apiKeyOrOptions.projectApiKey || apiKeyOrOptions.applicationId || "";
      this.apiSecret = apiKeyOrOptions.apiSecret || apiKeyOrOptions.personalApiKey || apiKeyOrOptions.secretKey || "";
      this.token = apiKeyOrOptions.token || null;
      this.host = apiKeyOrOptions.host || "https://api.kloddy.com";
      this.defaultOrgId = apiKeyOrOptions.defaultOrgId || null;
      this.defaultFeatureId = apiKeyOrOptions.defaultFeatureId || null;
    }
    if (!this.token && (!this.apiKey || !this.apiSecret)) {
      console.warn("KloddyClient: token or credentials missing. API calls will fail.");
    }
  }
  async login() {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error("KloddyClient: Cannot login without apiKey and apiSecret.");
    }
    const response = await fetch(`${this.host}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicationId: this.apiKey,
        secretKey: this.apiSecret
      })
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kloddy Auth failed: ${response.status} ${error}`);
    }
    const data = await response.json();
    this.token = data.token;
    this.tokenExpires = Date.now() + (data.expiresAt ? new Date(data.expiresAt).getTime() - Date.now() : 36e5);
    return this.token;
  }
  async getToken() {
    if (this.token && !this.apiSecret) {
      return this.token;
    }
    if (!this.token || this.tokenExpires && Date.now() >= this.tokenExpires - 6e4) {
      return this.login();
    }
    return this.token;
  }
  async request(path, options = {}) {
    const token = await this.getToken();
    const url = path.startsWith("http") ? path : `${this.host}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kloddy API error: ${response.status} ${error}`);
    }
    return await response.json();
  }
  /**
   * Get current user information.
   */
  async whoAmI() {
    return this.request("/api/whoiam");
  }
  /**
   * List organizations for the current user.
   */
  async listOrganizations() {
    return this.request("/api/organizations");
  }
  /**
   * List features, optionally filtered by organization.
   */
  async listFeatures(orgId) {
    const path = orgId ? `/api/features?org_id=${orgId}` : "/api/features";
    return this.request(path);
  }
};

// src/prompts.ts
var Prompts = class {
  client;
  constructor(options) {
    if ("posthog" in options && options.posthog) {
      this.client = options.posthog;
    } else {
      this.client = new KloddyClient(options);
    }
  }
  /**
   * List prompts with filters.
   */
  async list(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.append("page", options.page.toString());
    if (options.pageSize) params.append("pageSize", options.pageSize.toString());
    if (options.name) params.append("name", options.name);
    const orgId = options.org_id || this.client.defaultOrgId;
    if (orgId) params.append("org_id", orgId);
    const featureId = options.feature_id || this.client.defaultFeatureId;
    if (featureId) params.append("feature_id", featureId);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return this.client.request(`/api/prompts${queryString}`);
  }
  /**
   * Fetch a prompt template.
   */
  async get(name, options = {}) {
    const params = new URLSearchParams();
    if (options.version) params.append("version", options.version.toString());
    const resolve = options.resolve !== void 0 ? options.resolve : true;
    params.append("resolve", resolve.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    try {
      return await this.client.request(`/api/prompt/${name}${queryString}`, {
        method: "GET"
      });
    } catch (error) {
      if (options.fallback) {
        return {
          id: "fallback",
          name,
          content: options.fallback,
          version: 0
        };
      }
      throw error;
    }
  }
  /**
   * Execute a prompt via the Kloddy API.
   */
  async execute(name, options = {}) {
    return this.client.request(`/api/prompt/${name}`, {
      method: "POST",
      body: JSON.stringify({
        ...options,
        resolve: options.resolve !== void 0 ? options.resolve : true
      })
    });
  }
  /**
   * Play: Direct execution for a single model/version.
   * Same as execute but follows specific naming/body requirements.
   */
  async play(name, options = {}) {
    return this.client.request("/api/play", {
      method: "POST",
      body: JSON.stringify({
        name,
        ...options,
        resolve: options.resolve !== void 0 ? options.resolve : true
      })
    });
  }
  /**
   * Update: Download all prompts for the user/organization.
   */
  async update(options = {}) {
    return this.list(options);
  }
  /**
   * Local compilation of a template string with variables.
   */
  compile(template, variables) {
    let content = typeof template === "string" ? template : template.content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}|{${key}}`, "g");
      content = content.replace(regex, String(value));
    }
    return content;
  }
};

// src/evaluations.ts
var Evaluations = class {
  client;
  constructor(options) {
    if ("posthog" in options && options.posthog) {
      this.client = options.posthog;
    } else {
      this.client = new KloddyClient(options);
    }
  }
  /**
   * Run or retrieve an evaluation.
   */
  async run(options) {
    return this.client.request("/api/evaluate", {
      method: "POST",
      body: JSON.stringify(options)
    });
  }
  /**
   * Alias for run() as requested.
   */
  async evaluate(options) {
    return this.run(options);
  }
  /**
   * Legacy alias for run(name) as requested in the hook example.
   */
  async get(name, variables = {}) {
    return this.run({ name, variables });
  }
};

// src/hooks/use-prompt.tsx
import { createContext, useContext, useMemo } from "react";
import { jsx } from "react/jsx-runtime";
var KloddyContext = createContext(null);
var KloddyProvider = ({ children, client, options, apiKey, token }) => {
  const value = useMemo(() => {
    const activeClient = client || new KloddyClient({ ...options, apiKey, token });
    return {
      prompts: new Prompts({ posthog: activeClient }),
      evaluations: new Evaluations({ posthog: activeClient })
    };
  }, [client, options, token]);
  return /* @__PURE__ */ jsx(KloddyContext.Provider, { value, children });
};
var usePrompt = () => {
  const context = useContext(KloddyContext);
  if (!context) {
    throw new Error("usePrompt must be used within a KloddyProvider");
  }
  const { prompts, evaluations } = context;
  return {
    getPrompt: (id, options = {}) => prompts.get(id, options),
    getAwnser: (id, options = {}) => prompts.execute(id, options),
    // Use user's spelling "getAwnser"
    getEvaluation: (id, variables = {}) => evaluations.get(id, variables),
    compile: (template, variables) => prompts.compile(template, variables)
  };
};

// src/index.ts
var Kloddy = class {
  client;
  prompts;
  evaluations;
  constructor(apiKeyOrOptions, options) {
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
  async listFeatures(orgId) {
    return this.client.listFeatures(orgId);
  }
};
var index_default = Kloddy;
export {
  Evaluations,
  Kloddy,
  KloddyClient,
  KloddyProvider,
  Prompts,
  index_default as default,
  usePrompt
};
