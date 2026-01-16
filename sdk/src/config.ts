// sdk/src/config.ts
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default RPC URL for MOI devnet
export const DEFAULT_RPC_URL = 'https://voyage-rpc.moi.technology';

export const DEFAULT_IDENTITY_LOGIC_ID = '0x200000005fa2f01086d256f2d5824c3093b3e3b079ffcb01f9f75e1500000000';
export const DEFAULT_INTERACTION_LOGIC_ID = '0x2000000070c7ad3405c5d9efd61920bff4898c6a84b79f1b2212851900000000';

// Paths to contract manifests (relative to SDK package root)
export const IDENTITY_MANIFEST_PATH = path.resolve(
  __dirname,
  '../../contract/SageoIdentityLogic/sageoidentitylogic.yaml'
);

export const INTERACTION_MANIFEST_PATH = path.resolve(
  __dirname,
  '../../contract/SageoInteractionLogic/sageointeractionlogic.yaml'
);

// Sageo extension URI for A2A protocol
export const SAGEO_EXTENSION_URI = 'https://sageo.ai/extensions/trace';

// Re-export loadManifest from client for convenience
export { loadManifest } from './client.js';
