import { VoyageProvider, Wallet, LogicDriver } from 'js-moi-sdk';
import { getIdentifier } from './utils.js';
/**
 * Create a VoyageProvider for MOI devnet
 */
export declare function createProvider(rpcUrl?: string): Promise<VoyageProvider>;
/**
 * Create a wallet from mnemonic (private key is treated as mnemonic)
 * Note: The SDK accepts a "private key" parameter per spec, but js-moi-sdk uses mnemonic
 * For now, we treat the privateKey parameter as a mnemonic
 */
export declare function createWallet(privateKey: string, // Actually a mnemonic string
provider: VoyageProvider): Promise<Wallet>;
/**
 * Load a contract manifest from YAML file
 */
export declare function loadManifest(contractType: 'identity' | 'interaction'): any;
/**
 * Load a contract using LogicDriver
 * Note: LogicDriver requires a Wallet, not a Provider
 */
export declare function loadContract(config: {
    logicId: string;
    manifest: any;
}, signer: Wallet): Promise<LogicDriver>;
/**
 * Get wallet identifier as string
 */
export { getIdentifier };
//# sourceMappingURL=client.d.ts.map