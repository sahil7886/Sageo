import { ValidationError } from './errors.js';

export function validateLimit(limit?: string): number {
  if (!limit) return 50;
  const parsed = parseInt(limit, 10);
  if (isNaN(parsed) || parsed < 1) {
    throw new ValidationError('limit must be a positive integer');
  }
  if (parsed > 100) {
    throw new ValidationError('limit cannot exceed 100');
  }
  return parsed;
}

export function validateOffset(offset?: string): number {
  if (!offset) return 0;
  const parsed = parseInt(offset, 10);
  if (isNaN(parsed) || parsed < 0) {
    throw new ValidationError('offset must be a non-negative integer');
  }
  return parsed;
}

export function validateSageoId(sageo_id: string): string {
  if (!sageo_id || typeof sageo_id !== 'string' || sageo_id.trim() === '') {
    throw new ValidationError('sageo_id must be a non-empty string');
  }
  return sageo_id.trim();
}

