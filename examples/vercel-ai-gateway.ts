import { Kloddy } from '../src';
// Assume an OpenAI-compatible client
import OpenAI from 'openai';

/**
 * Example of using Kloddy with Vercel AI Gateway
 * Vercel AI Gateway: https://vercel.com/docs/ai-gateway/getting-started
 */
async function main() {
  const kloddy = new Kloddy({
    apiKey: 'KLODDY_API_KEY',
    apiSecret: 'KLODDY_SECRET'
  });

  // 1. Get the prompt from Kloddy
  const template = await kloddy.prompts.get('customer-support-agent');

  // 2. Compile the prompt
  const systemPrompt = kloddy.prompts.compile(template, {
    customerName: 'Bob'
  });

  // 3. Call Vercel AI Gateway
  const openai = new OpenAI({
    apiKey: 'OPENAI_API_KEY',
    baseURL: 'https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/openai' // Or Vercel AI Gateway URL
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'I have a problem with my order.' }
    ],
  });

  console.log('Response via AI Gateway:', completion.choices[0]?.message.content);
}

main();
