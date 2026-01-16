import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../api/src/app.js';
import { loadConfig } from '../api/src/lib/config.js';
import { initializeDeps } from '../api/src/lib/deps.js';
import { initializeMOI } from '../api/src/lib/moi-client.js';

// Initialize config and dependencies (this runs once per serverless function instance)
let initialized = false;

async function ensureInitialized() {
  if (initialized) return;
  
  try {
    const config = loadConfig();
    initializeDeps(config);
    
    // Initialize MOI SDK
    const mnemonic = process.env.MOI_MNEMONIC || 
      'repair cycle monitor satisfy warfare forest decorate reveal update economy pizza lift';
    await initializeMOI(mnemonic);
    
    initialized = true;
  } catch (error) {
    console.error('Initialization error:', error);
    // Don't throw - allow function to continue, some operations may still work
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureInitialized();
  
  // Strip /api prefix from the URL path if present (Vercel rewrites add it)
  const originalUrl = req.url || '';
  if (originalUrl.startsWith('/api')) {
    req.url = originalUrl.replace(/^\/api/, '') || '/';
  }
  
  // Convert Vercel request/response to Express-compatible format
  return new Promise<void>((resolve) => {
    // @ts-ignore - Express app expects Node.js req/res, Vercel provides compatible types
    app(req, res, () => {
      resolve();
    });
  });
}
