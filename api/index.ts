import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../backend/dist/app.js';
import { loadConfig } from '../backend/dist/lib/config.js';
import { initializeDeps } from '../backend/dist/lib/deps.js';
import { initializeMOI } from '../backend/dist/lib/moi-client.js';

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
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await ensureInitialized();

    const originalUrl = req.url || '/';
    req.url = originalUrl;

    return new Promise<void>((resolve) => {
        // @ts-ignore
        app(req, res, () => {
            resolve();
        });
    });
}
