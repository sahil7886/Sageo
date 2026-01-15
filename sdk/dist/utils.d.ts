import { Wallet } from 'js-moi-sdk';
import type { Message } from '@a2a-js/sdk';
import type { SageoTraceMetadata } from './types.js';
import { SAGEO_EXTENSION_URI } from './config.js';
export { SAGEO_EXTENSION_URI };
/**
 * Hash a payload using SHA-256
 */
export declare function hashPayload(payload: unknown): string;
/**
 * Extract SageoTraceMetadata from an A2A Message
 */
export declare function extractSageoMetadata(message: Message): SageoTraceMetadata | null;
/**
 * Get wallet identifier as string
 */
export declare function getIdentifier(wallet: Wallet): Promise<string>;
/**
 * Extract intent from message parts
 */
export declare function extractIntent(message: Message): string;
//# sourceMappingURL=utils.d.ts.map