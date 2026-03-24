# @kloddy/kloddy-js

Kloddy is the ultimate platform for Prompt Engineering and LLM Analytics. This SDK allows you to fetch, compile, and execute prompts directly from your Node.js or React applications with full type safety and zero-config support.

## Installation

```bash
# via npm
npm install @kloddy/kloddy-js

# via yarn
yarn add @kloddy/kloddy-js
```

## Quick Start

### Zero-Config Initialization (Node.js)

Kloddy automatically looks for `KLODDY_API_KEY` and `KLODDY_API_SECRET` in your environment variables.

```typescript
import { Kloddy } from '@kloddy/kloddy-js';

// Zero-config! Uses process.env.KLODDY_API_KEY and process.env.KLODDY_API_SECRET
const kloddy = new Kloddy();

// Type-safe prompts (Optional but recommended)
type MyPrompts = 'exam-generator' | 'customer-support' | 'welcome-email';
const kloddyTyped = new Kloddy<MyPrompts>();

// One-step execution (Play)
const { result } = await kloddyTyped.prompts.play('exam-generator', {
  variables: { locale: 'en-US', topic: 'Physics' }
});

console.log(result);
```

### Next.js Integration (App Router)

Securely generate tokens on the server without exposing secrets to the client.

```typescript
// app/api/kloddy/token/route.ts
import { createKloddyAdapter } from '@kloddy/kloddy-js/next';

export const GET = createKloddyAdapter({
  // Credentials picked up from env vars automatically
});
```

### React Hooks

Wrap your application with `KloddyProvider` and use the simplified hooks.

```tsx
// app/layout.tsx
import { KloddyProvider } from '@kloddy/kloddy-js';

export default function RootLayout({ children }) {
  return (
    <KloddyProvider authEndpoint="/api/kloddy/token">
      {children}
    </KloddyProvider>
  );
}

// components/PromptExecutor.tsx
'use client';
import { usePrompt } from '@kloddy/kloddy-js';

export function PromptExecutor() {
  const { getAwnser, isLoading } = usePrompt<'exam-generator'>();

  const handleRun = async () => {
    const { result } = await getAwnser('exam-generator', {
      variables: { topic: 'Math' }
    });
    alert(result);
  };

  return (
    <button onClick={handleRun} disabled={isLoading}>
      {isLoading ? 'Running...' : 'Generate Exam'}
    </button>
  );
}
```

## Features

- **Zero-Config**: Works out of the box with `process.env`.
- **Type Safety**: Use Generics to get autocomplete for your prompt names.
- **Next.js Ready**: Built-in adapter for secure token handling.
- **Graceful Degradation**: Built-in fallback support for offline mode or API issues.
- **Professional Error Handling**: Custom error classes like `KloddyAuthError` and `KloddyNotFoundError`.
- **Tree-Shakable**: Optimized for small bundle sizes.

## API Reference

### `Kloddy<TPromptNames>`
The main entry point for the SDK.
- `prompts.get(name, options)`: Fetch a template with optional version and fallback.
- `prompts.play(name, options)`: Execute a prompt directly in one step.
- `prompts.compile(template, variables)`: Locally compile a template string.
- `evaluations.run(options)`: Run model evaluations.

### React Hooks
- `usePrompt<TPromptNames>()`: Manage prompts and execution state.
- `useEvaluations()`: Manage model evaluations and comparisons.
- `usePromptStream<TPromptNames>()`: Support for streaming responses.

## Advanced Fallback Strategy

Prevent outages by providing a local fallback for critical prompts.

```typescript
const template = await kloddy.prompts.get('critical-prompt', {
  fallback: 'You are a helpful assistant. (Offline Fallback)'
});
```

## License

MIT © [Kloddy](https://kloddy.com)
