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

// DEPLOYED CONTRACT ADDRESSES (To be updated after deployment)
export const IDENTITY_LOGIC_ID = "0x20000000c4b857e2dd73df98ad23cf1b86affcbb4c46e583e16b70df00000000";
export const INTERACTION_LOGIC_ID = ""; // Failed deployment

// Cache for logic manifests
const manifestCache: Map<string, any> = new Map();

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
      `Contract manifest not found at ${manifestPath}. Run: cd contract/${
        contractName === 'identity' ? 'SageoIdentityLogic' : 'SageoInteractionLogic'
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
    
    return result ?? null;
  } catch (error) {
    // Wrap errors for consistent error handling
    throw new Error(
      `Failed to call MOI contract method ${methodName}: ${
        error instanceof Error ? error.message : 'Unknown error'
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
