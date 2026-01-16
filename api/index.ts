import type { VercelRequest, VercelResponse } from '@vercel/node';
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

    // Get the original URL path (Vercel provides this)
    const originalUrl = req.url || '/';

    // Set the path for Express - the rewrite already routes to this handler,
    // we need to reconstruct the path from the original request
    req.url = originalUrl;

    // Convert Vercel request/response to Express-compatible format
    return new Promise<void>((resolve) => {
        // @ts-ignore - Express app expects Node.js req/res, Vercel provides compatible types
        app(req, res, () => {
            resolve();
        });
    });
}
