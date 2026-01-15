// sdk/src/config.ts
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default RPC URL for MOI devnet
export const DEFAULT_RPC_URL = 'https://voyage-rpc.moi.technology';

export const DEFAULT_IDENTITY_LOGIC_ID = '0x20000000865b8e9d17a93e28d83f1f873e2981e8cacf58a9425ad23900000000';
export const DEFAULT_INTERACTION_LOGIC_ID = '0x20000000c9a634c87c3173259f2b11d5389bf78ab4f0b6b7d61585d100000000';

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
