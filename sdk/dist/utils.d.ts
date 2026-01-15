import { Wallet } from 'js-moi-sdk';
import type { Message } from '@a2a-js/sdk';
import type { SageoTraceMetadata } from './types.js';
import { SAGEO_EXTENSION_URI } from './config.js';
export { SAGEO_EXTENSION_URI };
export declare function hashPayload(payload: unknown): string;
export declare function extractSageoMetadata(message: Message): SageoTraceMetadata | null;
export declare function getIdentifier(wallet: Wallet): Promise<string>;
export declare function normalizeIdentifier(value: string): string;
export declare function extractIntent(message: Message): string;
//# sourceMappingURL=utils.d.ts.map