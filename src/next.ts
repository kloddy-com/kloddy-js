import { KloddyClient } from './client';
import { KloddyOptions } from './types';

/**
 * Creates a Next.js App Router route handler for Kloddy token generation.
 * This allows your frontend to fetch a session token securely without exposing API secrets.
 * 
 * @example
 * // app/api/kloddy/token/route.ts
 * import { createKloddyAdapter } from '@kloddy/kloddy-js/next';
 * 
 * export const GET = createKloddyAdapter({
 *   apiKey: process.env.KLODDY_API_KEY,
 *   apiSecret: process.env.KLODDY_API_SECRET,
 * });
 * 
 * @param options Kloddy options including credentials.
 * @returns A Next.js GET handler function.
 */
export function createKloddyAdapter(options: KloddyOptions = {}) {
  const client = new KloddyClient(options);

  return async function GET() {
    try {
      const token = await client.getToken();
      
      return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      console.error('Kloddy Adapter Error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
