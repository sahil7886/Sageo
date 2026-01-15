// sdk/src/client.ts
import { VoyageProvider, Wallet, LogicDriver } from 'js-moi-sdk';
import fs from 'fs';
import yaml from 'js-yaml';
import { IDENTITY_MANIFEST_PATH, INTERACTION_MANIFEST_PATH, } from './config.js';
import { getIdentifier } from './utils.js';
// Manifest cache
const manifestCache = new Map();
/**
 * Create a VoyageProvider for MOI devnet
 */
export async function createProvider(rpcUrl) {
    const url = rpcUrl || 'https://voyage-rpc.moi.technology';
    return new VoyageProvider('devnet');
}
/**
 * Create a wallet from mnemonic (private key is treated as mnemonic)
 * Note: The SDK accepts a "private key" parameter per spec, but js-moi-sdk uses mnemonic
 * For now, we treat the privateKey parameter as a mnemonic
 */
export async function createWallet(privateKey, // Actually a mnemonic string
provider) {
    // Use fromMnemonic (js-moi-sdk doesn't have fromPrivateKey)
    // The "privateKey" parameter is actually expected to be a mnemonic
    const wallet = await Wallet.fromMnemonic(privateKey, "m/44'/6174'/7020'/0/0");
    wallet.connect(provider);
    return wallet;
}
/**
 * Load a contract manifest from YAML file
 */
export function loadManifest(contractType) {
    const cacheKey = contractType;
    if (manifestCache.has(cacheKey)) {
        return manifestCache.get(cacheKey);
    }
    const manifestPath = contractType === 'identity'
        ? IDENTITY_MANIFEST_PATH
        : INTERACTION_MANIFEST_PATH;
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`Contract manifest not found at ${manifestPath}. Please ensure the contract is compiled.`);
    }
    const manifestYaml = fs.readFileSync(manifestPath, 'utf-8');
    // Fix for large hex numbers in YAML
    const manifestYamlSafe = manifestYaml.replace(/value:\s+(0x[0-9a-fA-F]+)/g, 'value: "$1"');
    const manifest = yaml.load(manifestYamlSafe);
    manifestCache.set(cacheKey, manifest);
    return manifest;
}
/**
 * Load a contract using LogicDriver
 * Note: LogicDriver requires a Wallet, not a Provider
 */
export async function loadContract(config, signer) {
    return new LogicDriver(config.logicId, config.manifest, signer);
}
/**
 * Get wallet identifier as string
 */
export { getIdentifier };
//# sourceMappingURL=client.js.map