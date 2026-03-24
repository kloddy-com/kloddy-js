# @kloddy/kloddy-js

Kloddy is the ultimate platform for Prompt Engineering and LLM Analytics. This SDK allows you to fetch, compile, and execute prompts directly from your Node.js or React applications.

## installation

```bash
# via npm
npm install @kloddy/kloddy-js

# via yarn
yarn add @kloddy/kloddy-js
```

## Quick Start

### Basic Usage (Node.js)

```javascript
import { Kloddy } from 'kloddy-js';

const kloddy = new Kloddy({
  apiKey: '<your_project_api_key>',
  apiSecret: '<your_personal_api_key>',
  host: 'https://api.kloddy.com' // Optional
});

// Fetch a prompt template
const template = await kloddy.prompts.get('customer-support-agent', {
  fallback: 'You are a helpful assistant.'
});

// Compile with variables
const systemPrompt = kloddy.prompts.compile(template, {
  userName: 'Alice',
  company: 'Acme Corp'
});

console.log(systemPrompt);
```

### React Usage

Wrap your app with `KloddyProvider`. For security, it is highly recommended to generate an **accessToken** on your server and pass it to the frontend instead of using your `apiSecret` in the browser.

```tsx
import { KloddyProvider, usePrompt } from '@kloddy/kloddy-js';

function MyComponent() {
  const { getPrompt, getAwnser } = usePrompt();

  const handleWelcome = async () => {
    const prompt = await getPrompt('welcome-message');
    const response = await getAwnser('welcome-message', {
      variables: { name: 'Alice' }
    });
    console.log(response.result);
  };

  return <button onClick={handleWelcome}>Say Hello</button>;
}

function App() {
  // The token should be fetched from your own API
  const [token, setToken] = useState('');

  return (
    <KloddyProvider apiKey="YOUR_PROJECT_ID" token={token}>
      <MyComponent />
    </KloddyProvider>
  );
}
```

## Advanced Usage

### Organization & Feature Context
You can set a default organization or feature ID during initialization to simplify your calls.

```javascript
const kloddy = new Kloddy({
  apiKey: '...',
  defaultOrgId: 'org_123',
  defaultFeatureId: 'feat_456'
});

// These will now use the defaults automatically
const prompts = await kloddy.prompts.list();
const features = await kloddy.listFeatures();
```

### Account Information
```javascript
const user = await kloddy.whoAmI();
const orgs = await kloddy.listOrganizations();
const features = await kloddy.listFeatures(orgs[0].id);
```

### Prompts Management
```javascript
// List all prompts
const allPrompts = await kloddy.prompts.list({ pageSize: 50 });

// Update/Sync (alias for list)
const synced = await kloddy.prompts.update();

// Play (Direct Execution)
const result = await kloddy.prompts.play('my-prompt', {
  variables: { user: 'Alice' },
  model: 'gpt-4'
});
```

### Evaluations
```javascript
const evalResult = await kloddy.evaluations.evaluate({
  name: 'model-comparison',
  models: ['gpt-4', 'claude-3'],
  judge: 'gpt-4-judge',
  variables: { input: '...' },
  temperature: 0.7
});
```

## API Reference

### `Kloddy` Client
- `whoAmI()`: Get current user details.
- `listOrganizations()`: List organizations.
- `listFeatures(orgId?)`: List features.
- `prompts.list(filters)`: List prompts with pagination and filters.
- `prompts.get(name, options)`: Fetch a template.
- `prompts.play(name, options)`: Execute a prompt directly.
- `prompts.update()`: Sync all prompts.
- `evaluations.evaluate(options)`: Run model evaluations.

### React Hooks
- `usePrompt()`: Returns `getPrompt`, `getAwnser`, `getEvaluation`, `compile`.

## Integration with Vercel AI Gateway

You can use Kloddy to manage your prompts and Vercel AI Gateway to route your LLM calls.

```javascript
const template = await kloddy.prompts.get('support-agent');
const systemPrompt = kloddy.prompts.compile(template, { user: 'Alice' });

// Use with OpenAI via Vercel AI Gateway
const openai = new OpenAI({
  baseURL: 'https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/openai'
});
```

## License

MIT © [Kloddy](https://kloddy.com)
