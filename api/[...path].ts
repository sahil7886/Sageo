import type { VercelRequest, VercelResponse } from '@vercel/node';
// Use compiled dist files if available, otherwise fall back to src (for Vercel's TypeScript compilation)
import app from './dist/app.js';
import { loadConfig } from './dist/lib/config.js';
import { initializeDeps } from './dist/lib/deps.js';
import { initializeMOI } from './dist/lib/moi-client.js';

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
  
  // Reconstruct the path from the catch-all parameter
  // For /api/agents?limit=8, the path array would be ['agents']
  const pathArray = req.query.path as string[] | string | undefined;
  const pathSegment = Array.isArray(pathArray) 
    ? pathArray.join('/') 
    : (pathArray || '');
  
  // Build the full path (e.g., /agents)
  const basePath = pathSegment ? `/${pathSegment}` : '/';
  
  // Preserve query string from original URL
  const originalUrl = req.url || '';
  const queryString = originalUrl.includes('?') 
    ? originalUrl.split('?')[1] 
    : '';
  
  // Set the path for Express
  const finalPath = queryString ? `${basePath}?${queryString}` : basePath;
  req.url = finalPath;
  req.path = basePath;
  
  // Convert Vercel request/response to Express-compatible format
  return new Promise<void>((resolve) => {
    // @ts-ignore - Express app expects Node.js req/res, Vercel provides compatible types
    app(req, res, () => {
      resolve();
    });
  });
}
