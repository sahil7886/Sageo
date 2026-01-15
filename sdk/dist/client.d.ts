import { VoyageProvider, Wallet, LogicDriver } from 'js-moi-sdk';
import { getIdentifier } from './utils.js';
export declare function createProvider(rpcUrl?: string): Promise<VoyageProvider>;
export declare function createWallet(privateKey: string, provider: VoyageProvider): Promise<Wallet>;
export declare function loadManifest(contractType: 'identity' | 'interaction'): any;
export declare function loadContract(config: {
    logicId: string;
    manifest: any;
}, signer: Wallet): Promise<LogicDriver>;
export { getIdentifier };
//# sourceMappingURL=client.d.ts.map