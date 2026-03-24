"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Evaluations: () => Evaluations,
  Kloddy: () => Kloddy,
  KloddyClient: () => KloddyClient,
  KloddyProvider: () => KloddyProvider,
  Prompts: () => Prompts,
  default: () => index_default,
  usePrompt: () => usePrompt
});
module.exports = __toCommonJS(index_exports);

// src/client.ts
var import_cross_fetch = __toESM(require("cross-fetch"));
var KloddyClient = class {
  apiKey;
  apiSecret;
  host;
  token = null;
  tokenExpires = null;
  constructor(apiKeyOrOptions, options) {
    if (typeof apiKeyOrOptions === "string") {
      this.apiKey = apiKeyOrOptions;
      this.apiSecret = options?.apiSecret || options?.personalApiKey || options?.secretKey || "";
      this.token = options?.token || null;
      this.host = options?.host || "https://api.kloddy.com";
    } else {
      this.apiKey = apiKeyOrOptions.apiKey || apiKeyOrOptions.projectApiKey || apiKeyOrOptions.applicationId || "";
      this.apiSecret = apiKeyOrOptions.apiSecret || apiKeyOrOptions.personalApiKey || apiKeyOrOptions.secretKey || "";
      this.token = apiKeyOrOptions.token || null;
      this.host = apiKeyOrOptions.host || "https://api.kloddy.com";
    }
    if (!this.token && (!this.apiKey || !this.apiSecret)) {
      console.warn("KloddyClient: token or credentials missing. API calls will fail.");
    }
  }
  async login() {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error("KloddyClient: Cannot login without apiKey and apiSecret.");
    }
    const response = await (0, import_cross_fetch.default)(`${this.host}/api/login`, {
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
    const response = await (0, import_cross_fetch.default)(url, {
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
   * Fetch the latest version of a prompt template.
   */
  async get(name, options = {}) {
    const params = new URLSearchParams();
    if (options.version) params.append("version", options.version.toString());
    if (options.resolve !== void 0) params.append("resolve", options.resolve.toString());
    const queryString = params.toString() ? `?${params.toString()}` : "";
    try {
      const prompt = await this.client.request(`/api/prompt/${name}${queryString}`, {
        method: "GET"
      });
      return prompt;
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
      body: JSON.stringify(options)
    });
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
   * Alias for run(name) as requested in the hook example.
   */
  async get(name, variables = {}) {
    return this.run({ name, variables });
  }
};

// src/hooks/use-prompt.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var KloddyContext = (0, import_react.createContext)(null);
var KloddyProvider = ({ children, client, options, apiKey, token }) => {
  const value = (0, import_react.useMemo)(() => {
    const activeClient = client || new KloddyClient({ ...options, apiKey, token });
    return {
      prompts: new Prompts({ posthog: activeClient }),
      evaluations: new Evaluations({ posthog: activeClient })
    };
  }, [client, options, token]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KloddyContext.Provider, { value, children });
};
var usePrompt = () => {
  const context = (0, import_react.useContext)(KloddyContext);
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
};
var index_default = Kloddy;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Evaluations,
  Kloddy,
  KloddyClient,
  KloddyProvider,
  Prompts,
  usePrompt
});
