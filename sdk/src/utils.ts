// sdk/src/utils.ts
import { createHash } from 'crypto';
import { Wallet } from 'js-moi-sdk';
import type { Message } from '@a2a-js/sdk';
import type { SageoTraceMetadata } from './types.js';
import { SAGEO_EXTENSION_URI } from './config.js';

// Re-export SAGEO_EXTENSION_URI for convenience
export { SAGEO_EXTENSION_URI };

export function hashPayload(payload: unknown): string {
  const jsonString = JSON.stringify(payload);
  const hash = createHash('sha256');
  hash.update(jsonString);
  return hash.digest('hex');
}


export function extractSageoMetadata(message: Message): SageoTraceMetadata | null {
  if (!message.metadata) {
    return null;
  }

  const metadata = message.metadata[SAGEO_EXTENSION_URI];
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  return metadata as SageoTraceMetadata;
}


export async function getIdentifier(wallet: Wallet): Promise<string> {
  const identifier = (wallet as any).getIdentifier
    ? (wallet as any).getIdentifier()
    : (wallet as any).getAddress
    ? await (wallet as any).getAddress()
    : null;

  if (!identifier) {
    throw new Error('Cannot get wallet identifier');
  }

  return identifier.toString ? identifier.toString() : String(identifier);
}

export function normalizeIdentifier(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.startsWith('0x')) {
    return trimmed;
  }
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return `0x${trimmed}`;
  }
  return trimmed;
}


export function extractIntent(message: Message): string {
  if (!message.parts || message.parts.length === 0) {
    return 'agent_interaction';
  }

  // Try to extract from first text part
  for (const part of message.parts) {
    if (part.kind === 'text' && 'text' in part) {
      const text = (part as any).text || '';
      
      // Use first 50 chars as intent, or default
      if (text.length > 0) {
        return text.substring(0, 50).trim() || 'agent_interaction';
      }
    }
  }

  return 'agent_interaction';
}
