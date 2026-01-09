import { Config } from './config.js';
import { ApiError } from './errors.js';

export interface Dependencies {
  identity: string | null;
  interaction: string | null;
}

let deps: Dependencies = {
  identity: null,
  interaction: null,
};

export function initializeDeps(config: Config): Dependencies {
  deps = {
    identity: config.IDENTITY_LOGIC_ADDRESS,
    interaction: config.INTERACTION_LOGIC_ADDRESS,
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

