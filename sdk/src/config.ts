// sdk/src/config.ts
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default RPC URL for MOI devnet
export const DEFAULT_RPC_URL = 'https://voyage-rpc.moi.technology';

export const DEFAULT_IDENTITY_LOGIC_ID = '0x200000007fc035987f386fb0ed0a740c157a8cd49662234abfabe34600000000';
export const DEFAULT_INTERACTION_LOGIC_ID = '0x200000004732f082f35bc25748486782a7a51d37908edcc5b76852ca00000000';

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
