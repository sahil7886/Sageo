import { Config } from './config.js';
import { ApiError } from './errors.js';
import { getProvider, getLogicDriver } from './moi-client.js';
import fs from 'fs';
import path from 'path';
import { LogicManifest } from 'js-moi-sdk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for logic manifests
const manifestCache: Map<string, LogicManifest.Manifest> = new Map();

/**
 * Loads a logic manifest from the compiled YAML file
 */
function loadManifest(contractName: 'identity' | 'interaction'): LogicManifest.Manifest {
  const cacheKey = contractName;
  
  if (manifestCache.has(cacheKey)) {
    return manifestCache.get(cacheKey)!;
  }

  const manifestPath =
    contractName === 'identity'
      ? path.resolve(__dirname, '../../../moi/SageoIdentityLogic/sageoidentitylogic.yaml')
      : path.resolve(__dirname, '../../../moi/SageoInteractionLogic/sageointeractionlogic.yaml');

  if (!fs.existsSync(manifestPath)) {
    throw new ApiError(
      500,
      'CHAIN_ERROR',
      `Contract manifest not found at ${manifestPath}. Run: cd moi/${
        contractName === 'identity' ? 'SageoIdentityLogic' : 'SageoInteractionLogic'
      } && coco compile .`
    );
  }

  const manifestYaml = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = LogicManifest.fromYAML(manifestYaml);
  manifestCache.set(cacheKey, manifest);
  
  return manifest;
}

/**
 * Calls a read-only method on a MOI logic contract using js-moi-sdk
 */
export async function readLogic(
  config: Config,
  logicAddress: string,
  methodName: string,
  contractType: 'identity' | 'interaction',
  ...args: unknown[]
): Promise<unknown> {
  try {
    // Get the provider
    const provider = getProvider();

    // Load the manifest for this contract
    const manifest = loadManifest(contractType);

    // Create a logic driver instance (read-only, no wallet needed)
    const logicDriver = await provider.getLogicDriver(logicAddress, manifest);

    // Call the routine
    const result = await logicDriver.routines[methodName](...args);

    return result ?? null;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Wrap other errors
    throw new ApiError(
      500,
      'CHAIN_ERROR',
      `Failed to call MOI contract method ${methodName}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

