import { Config } from './config.js';
import { ApiError } from './errors.js';
import { IDENTITY_LOGIC_ID, INTERACTION_LOGIC_ID } from './moi-client.js';

export interface Dependencies {
  identity: string | null;
  interaction: string | null;
}

let deps: Dependencies = {
  identity: null,
  interaction: null,
};

export function initializeDeps(config: Config): Dependencies {
  // Use environment variables if set, otherwise fall back to hardcoded constants from moi-client.ts
  // This allows development to work without env vars, while production can override via env vars
  deps = {
    identity: config.IDENTITY_LOGIC_ADDRESS || (IDENTITY_LOGIC_ID && IDENTITY_LOGIC_ID.trim() !== '' ? IDENTITY_LOGIC_ID : null),
    interaction: config.INTERACTION_LOGIC_ADDRESS || (INTERACTION_LOGIC_ID && INTERACTION_LOGIC_ID.trim() !== '' ? INTERACTION_LOGIC_ID : null),
  };
  return deps;
}

export function getDeps(): Dependencies {
  return deps;
}

export function requireContract(name: 'identity' | 'interaction'): string {
  const address = deps[name];
  if (!address) {
    throw new ApiError(
      501,
      'NOT_IMPLEMENTED',
      `${name} contract not configured`
    );
  }
  return address;
}

