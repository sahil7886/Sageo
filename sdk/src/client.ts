// sdk/src/client.ts
import { VoyageProvider, Wallet, LogicDriver } from 'js-moi-sdk';
import fs from 'fs';
import yaml from 'js-yaml';
import {
  IDENTITY_MANIFEST_PATH,
  INTERACTION_MANIFEST_PATH,
} from './config.js';
import { getIdentifier } from './utils.js';

// Manifest cache
const manifestCache: Map<string, any> = new Map();

export async function createProvider(rpcUrl?: string): Promise<VoyageProvider> {
  const url = rpcUrl || 'https://voyage-rpc.moi.technology';
  return new VoyageProvider('devnet');
}

export async function createWallet(
  privateKey: string,
  provider: VoyageProvider
): Promise<Wallet> {
  const derivationPath = "m/44'/6174'/7020'/0/0";

  const wallet = await Wallet.fromMnemonic(privateKey, derivationPath);
  wallet.connect(provider);
  return wallet;
}

export function loadManifest(contractType: 'identity' | 'interaction'): any {
  const cacheKey = contractType;

  if (manifestCache.has(cacheKey)) {
    return manifestCache.get(cacheKey)!;
  }

  const manifestPath =
    contractType === 'identity'
      ? IDENTITY_MANIFEST_PATH
      : INTERACTION_MANIFEST_PATH;

  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Contract manifest not found at ${manifestPath}. Please ensure the contract is compiled.`
    );
  }

  const manifestYaml = fs.readFileSync(manifestPath, 'utf-8');

  // Fix for large hex numbers in YAML
  const manifestYamlSafe = manifestYaml.replace(
    /value:\s+(0x[0-9a-fA-F]+)/g,
    'value: "$1"'
  );
  const manifest = yaml.load(manifestYamlSafe) as any;
  manifestCache.set(cacheKey, manifest);

  return manifest;
}

export async function loadContract(
  config: { logicId: string; manifest: any },
  signer: Wallet
): Promise<LogicDriver> {
  return new LogicDriver(config.logicId, config.manifest, signer);
}

export { getIdentifier };
