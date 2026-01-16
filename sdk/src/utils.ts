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
      
      if (text.length > 0) {
        return extractKeywords(text) || 'agent_interaction';
      }
    }
  }

  return 'agent_interaction';
}

function extractKeywords(text: string): string {
  // Common stop words to filter out
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
    'had', 'what', 'said', 'each', 'which', 'their', 'time', 'if',
    'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her',
    'would', 'make', 'like', 'into', 'him', 'has', 'two', 'more',
    'very', 'after', 'words', 'long', 'than', 'first', 'been', 'call',
    'who', 'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get',
    'come', 'made', 'may', 'part', 'user', 'asked', 'provide', 'context'
  ]);

  // Extract words: split by whitespace and punctuation, filter out empty strings
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 0);

  // Filter out stop words and short words (unless capitalized in original)
  const keywords: string[] = [];
  const originalWords = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const originalWord = originalWords[i] || word;
    
    // Keep word if:
    // - It's longer than 3 characters AND not a stop word
    // - OR it's capitalized in original (likely important)
    if (
      word.length > 3 && !stopWords.has(word) ||
      /^[A-Z]/.test(originalWord) && word.length > 2
    ) {
      keywords.push(word);
    }
  }

  // Join keywords and limit to 50 characters
  const result = keywords.join('_').substring(0, 50).replace(/_+$/, '');
  return result || 'agent_interaction';
}
