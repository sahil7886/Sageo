import { VoyageProvider, Wallet, LogicDriver, LogicFactory, type LogicManifest, ManifestCoder, ManifestCoderFormat } from 'js-moi-sdk';
import { Config } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HARDCODED CONSTANTS
export const MOI_MNEMONIC = "repair cycle monitor satisfy warfare forest decorate reveal update economy pizza lift";
export const MOI_DERIVATION_PATH = "m/44'/6174'/7020'/0/0";
export const MOI_NETWORK = 'devnet';

// DEPLOYED CONTRACT ADDRESSES (Updated after deployment)
export const IDENTITY_LOGIC_ID = "0x20000000c90ca229fda422445dc1e27e6dd7db98b1cb94f29899c4ea00000000";
export const INTERACTION_LOGIC_ID = "0x20000000dc38f3e52ba02ae87361977cdc34a2a99f28fc0461f4f94800000000";


// Cache for logic manifests
const manifestCache: Map<string, any> = new Map();

/**
 * Simple helper to extract string values from POLO-encoded hex
 * This is a fallback when ManifestCoder doesn't work
 */
function extractStringFromPolo(hex: string): string | null {
  try {
    // Validate input is actually a string
    if (typeof hex !== 'string') {
      return null;
    }

    // Remove 0x prefix if present
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;

    // POLO encoding: length byte(s) followed by string bytes
    // For simple strings, look for patterns like: [length][string_bytes]
    // The hex contains ASCII-encoded strings
    const buffer = Buffer.from(cleanHex, 'hex');

    // Try to find "interaction_id" followed by the actual ID
    const interactionIdMarker = Buffer.from('interaction_id', 'utf-8');
    const markerIndex = buffer.indexOf(interactionIdMarker);

    if (markerIndex !== -1) {
      // After the marker, there should be the ID value
      // Look for "ix_" pattern
      const ixMarker = Buffer.from('ix_', 'utf-8');
      const ixIndex = buffer.indexOf(ixMarker, markerIndex);

      if (ixIndex !== -1) {
        // Extract the ID starting from "ix_"
        let idStart = ixIndex;
        let idEnd = idStart + 3; // "ix_"

        // Read digits after "ix_"
        while (idEnd < buffer.length && buffer[idEnd] >= 0x30 && buffer[idEnd] <= 0x39) {
          idEnd++;
        }

        return buffer.slice(idStart, idEnd).toString('utf-8');
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Loads a logic manifest from the compiled YAML file
 */
function loadManifest(contractName: 'identity' | 'interaction'): any {
  const cacheKey = contractName;

  if (manifestCache.has(cacheKey)) {
    return manifestCache.get(cacheKey)!;
  }

  const manifestPath =
    contractName === 'identity'
      ? path.resolve(__dirname, '../../../contract/SageoIdentityLogic/sageoidentitylogic.yaml')
      : path.resolve(__dirname, '../../../contract/SageoInteractionLogic/sageointeractionlogic.yaml');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Contract manifest not found at ${manifestPath}. Run: cd contract/${contractName === 'identity' ? 'SageoIdentityLogic' : 'SageoInteractionLogic'
      } && coco compile .`
    );
  }

  const manifestYaml = fs.readFileSync(manifestPath, 'utf-8');
  // Use js-yaml to parse, applying the same fix as in deploy script for large hex numbers
  const manifestYamlSafe = manifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
  const manifest = yaml.load(manifestYamlSafe) as any;
  manifestCache.set(cacheKey, manifest);

  return manifest;
}

// Singleton instances
let providerInstance: VoyageProvider | null = null;
let walletInstance: Wallet | null = null;

/**
 * Initialize the MOI provider and wallet using VoyageProvider for devnet
 */
export async function initializeMOI(mnemonic: string = MOI_MNEMONIC): Promise<{ provider: VoyageProvider; wallet: Wallet }> {
  if (!providerInstance) {
    providerInstance = new VoyageProvider(MOI_NETWORK);
  }

  if (!walletInstance) {
    // Create wallet from mnemonic with hardcoded path
    walletInstance = await Wallet.fromMnemonic(mnemonic, MOI_DERIVATION_PATH);
    walletInstance.connect(providerInstance);
  }

  return {
    provider: providerInstance,
    wallet: walletInstance!,
  };
}

/**
 * Get the initialized provider (throws if not initialized)
 */
export function getProvider(): VoyageProvider {
  if (!providerInstance) {
    // Auto-initialize if not done yet
    providerInstance = new VoyageProvider(MOI_NETWORK);
  }
  return providerInstance;
}

/**
 * Get the initialized wallet (throws if not initialized)
 */
export function getWallet(): Wallet {
  if (!walletInstance) {
    throw new Error('MOI wallet not initialized. Call initializeMOI() first.');
  }
  return walletInstance;
}

/**
 * Deploys a logic contract to MOI blockchain
 */
export async function deployLogic(
  manifest: any,
  wallet: Wallet
): Promise<string> {
  try {
    // Use LogicFactory for deployment
    // LogicDriver constructor: (logicId, manifest, signer) - LogicDriver is for interacting with existing logic
    // LogicFactory constructor: (manifest, signer) - LogicFactory is for deploying new logic
    const logicFactory = new LogicFactory(manifest, wallet);
    const ix = await logicFactory.deploy('Deploy');
    const receipt = await ix.wait();

    // Log receipt to find logic_id
    console.log('Deployment Receipt:', JSON.stringify(receipt, null, 2));

    // Check if deployment failed (status 1 = error)
    const receiptStatus = (receipt as any).status;
    const opStatus = receipt.ix_operations?.[0]?.status;
    
    if (receiptStatus === 1 || opStatus === 1) {
      throw new Error(`Deployment transaction failed on-chain (status=${receiptStatus}, op_status=${opStatus}). The Deploy endpoint likely threw an error.`);
    }

    // Try to find logic_id in receipt result. 
    // Found in receipt.ix_operations[0].data.logic_id
    let logicId = (receipt as any).logic_id || (ix as any).logic_id;

    if (!logicId && receipt.ix_operations && receipt.ix_operations.length > 0) {
      const opData = receipt.ix_operations[0].data;
      if (opData && 'logic_id' in opData) {
        logicId = (opData as any).logic_id;
      }
    }

    console.log(`Logic deployed with ID: ${logicId}`);
    return logicId;
  } catch (error) {
    throw new Error(
      `Failed to deploy logic: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Calls a read-only method on a MOI logic contract using js-moi-sdk
 * Note: This also handles 'dynamic' endpoints that return interaction objects
 */
export async function readLogic(
  _config: Config | null, // Ignored, keeping signature for compatibility
  logicAddress: string,
  methodName: string,
  contractType: 'identity' | 'interaction',
  ...args: unknown[]
): Promise<unknown> {
  try {
    const provider = getProvider();

    // Load manifest for this contract type
    const manifest = loadManifest(contractType);

    // Get logic driver for read-only calls
    let logicDriver;
    // LogicDriver constructor needs (logicId, manifest, signer|provider)
    if (walletInstance) {
      logicDriver = new LogicDriver(logicAddress, manifest, walletInstance);
    } else {
      const { wallet } = await initializeMOI();
      logicDriver = new LogicDriver(logicAddress, manifest, wallet);
    }

    // Call the routine
    const result = await logicDriver.routines[methodName](...args);

    // Check if result is an interaction object (dynamic endpoint)
    // Dynamic endpoints return { hash: string, wait: Function, result: Function, ... }
    if (result && typeof result === 'object' && 'wait' in result && typeof (result as any).wait === 'function') {
      // This is a dynamic endpoint - use interaction.result() to get decoded outputs
      // The result() method waits for the transaction and decodes the POLO outputs automatically
      if (typeof (result as any).result === 'function') {
        try {
          const decoded = await (result as any).result();
          // decoded has { output: {...}, error: null } structure
          return decoded?.output ?? decoded ?? null;
        } catch (e) {
          // Fall back to waiting for receipt if result() fails
          console.warn(`interaction.result() failed for ${methodName}, falling back to receipt`);
        }
      }

      // Fallback: wait for receipt (but outputs won't be decoded)
      const receipt = await (result as any).wait();
      return receipt ?? null;
    }

    return result ?? null;
  } catch (error) {
    // Wrap errors for consistent error handling
    throw new Error(
      `Failed to call MOI contract method ${methodName}: ${error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Calls a state-changing method on a MOI logic contract using js-moi-sdk
 */
export async function writeLogic(
  logicAddress: string,
  methodName: string,
  contractType: 'identity' | 'interaction',
  ...args: unknown[]
): Promise<unknown> {
  try {
    // Ensure wallet is initialized
    let wallet = walletInstance;
    if (!wallet) {
      const initResult = await initializeMOI();
      wallet = initResult.wallet;
    }

    // Load manifest for this contract type
    const manifest = loadManifest(contractType);

    // Create logic driver for write operations
    const logicDriver = new LogicDriver(logicAddress, manifest, wallet);

    // Call the routine (this returns an interaction that needs to be waited on)
    const interaction = await logicDriver.routines[methodName](...args);

    // Wait for the transaction to be confirmed
    const receipt = await interaction.wait();

    // Extract return value from receipt if available
    // MOI SDK may return values in different places:
    // - receipt.result (direct return value, already decoded)
    // - receipt.output (wrapped output, already decoded)
    // - receipt.ix_operations[0].data.outputs (POLO-encoded hex string)
    // Note: interaction.result might be a function, so we skip it
    let returnValue = (receipt as any).result ?? (receipt as any).output;

    // Only use interaction.result if it's not a function
    const interactionResult = (interaction as any).result;
    if (interactionResult && typeof interactionResult !== 'function') {
      returnValue = returnValue ?? interactionResult;
    }

    // Check for POLO-encoded outputs in ix_operations
    const outputsHex = (receipt as any).outputs
      ?? receipt.ix_operations?.[0]?.data?.outputs
      ?? null;

    // Debug logging for RegisterAgent
    if (methodName === 'RegisterAgent' && outputsHex) {
      console.log('RegisterAgent outputsHex type:', typeof outputsHex);
      console.log('RegisterAgent outputsHex value:', JSON.stringify(outputsHex).slice(0, 200));
    }

    // If not found, check for POLO-encoded outputs and decode them
    if (!returnValue && outputsHex) {
      // If outputsHex is already decoded (not a string), use it directly
      if (typeof outputsHex !== 'string') {
        returnValue = outputsHex;
      } else {
        // Try simple extraction first (most reliable for interaction_id)
        const extracted = extractStringFromPolo(outputsHex);
        if (extracted && extracted.startsWith('ix_')) {
          // Successfully extracted interaction_id
          returnValue = { interaction_id: extracted };
        } else {
          // Try ManifestCoder decoding as fallback
          try {
            // Find the routine in manifest to get return type info
            const routine = manifest.elements?.find((el: any) =>
              el.kind === 'callable' &&
              el.data?.name === methodName
            );

            if (routine && routine.data?.returns) {
              // Use ManifestCoder to decode
              const manifestCoder = new ManifestCoder(manifest);
              // Try decodeOutput method (checking common method names)
              const decoded = (manifestCoder as any).decodeOutput?.(outputsHex)
                ?? (manifestCoder as any).decode?.(outputsHex, routine.data.returns)
                ?? null;

              if (decoded) {
                returnValue = decoded;
              }
            }
          } catch (decodeError) {
            // If decoding fails, silently continue (some methods don't need decoding)
            // Only log if it's not a known issue (Enlist has no return, LogResponse has complex record)
            if (methodName !== 'LogResponse' && methodName !== 'Enlist') {
              console.warn(`Failed to decode POLO outputs for ${methodName}:`, decodeError);
            }
          }

          // If still no value, return raw outputs with helper info
          if (!returnValue) {
            returnValue = {
              outputs: outputsHex,
              _raw: true,
              _note: 'POLO-encoded, needs manual decoding'
            };
          }
        }
      }
    }

    // If not found, check ix_operations
    if (!returnValue && receipt.ix_operations && receipt.ix_operations.length > 0) {
      const opData = receipt.ix_operations[0].data;
      returnValue = opData?.result ?? opData?.output ?? opData;
    }

    // Fallback to receipt itself if no return value found
    return returnValue ?? receipt ?? null;
  } catch (error) {
    // Wrap errors for consistent error handling
    throw new Error(
      `Failed to call MOI contract method ${methodName}: ${error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Creates a LogicDriver instance for interacting with a deployed logic
 */
export async function getLogicDriver(
  logicId: string,
  manifest: any
): Promise<LogicDriver> {
  try {
    const wallet = getWallet();
    return new LogicDriver(logicId, manifest, wallet);
  } catch (error) {
    throw new Error(
      `Failed to create logic driver: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
