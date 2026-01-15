// sdk/src/config.ts
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Default RPC URL for MOI devnet
export const DEFAULT_RPC_URL = 'https://voyage-rpc.moi.technology';
export const DEFAULT_IDENTITY_LOGIC_ID = '0x20000000c90ca229fda422445dc1e27e6dd7db98b1cb94f29899c4ea00000000';
export const DEFAULT_INTERACTION_LOGIC_ID = '0x20000000dc38f3e52ba02ae87361977cdc34a2a99f28fc0461f4f94800000000';
// Paths to contract manifests (relative to SDK package root)
export const IDENTITY_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoIdentityLogic/sageoidentitylogic.yaml');
export const INTERACTION_MANIFEST_PATH = path.resolve(__dirname, '../../contract/SageoInteractionLogic/sageointeractionlogic.yaml');
// Sageo extension URI for A2A protocol
export const SAGEO_EXTENSION_URI = 'https://sageo.ai/extensions/trace';
// Re-export loadManifest from client for convenience
export { loadManifest } from './client.js';
//# sourceMappingURL=config.js.map