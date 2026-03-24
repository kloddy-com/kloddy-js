import { Kloddy } from '../src';

async function main() {
  // Initialize Kloddy
  const kloddy = new Kloddy({
    apiKey: 'your_project_api_key',
    apiSecret: 'your_personal_api_key',
    host: 'https://api.kloddy.com'
  });

  try {
    // 1. Fetch a prompt template
    console.log('Fetching prompt...');
    const template = await kloddy.prompts.get('support-system-prompt', {
      fallback: 'You are a helpful AI assistant.'
    });
    console.log('Template:', template.content);

    // 2. Compile locally
    const compiled = kloddy.prompts.compile(template, {
      userName: 'Alice',
      company: 'Kloddy'
    });
    console.log('Compiled:', compiled);

    // 3. Execute directly via API
    console.log('Executing prompt...');
    const result = await kloddy.prompts.execute('hello-world', {
      variables: { user: 'Alice' }
    });
    console.log('Execution result:', result.result);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
