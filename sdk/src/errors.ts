// sdk/src/errors.ts

export class ContractLoadError extends Error {
  constructor(
    public readonly logicId: string,
    public readonly originalError?: unknown
  ) {
    super(`Failed to load contract ${logicId}: ${originalError instanceof Error ? originalError.message : 'Unknown error'}`);
    this.name = 'ContractLoadError';
  }
}

export class SignerRequiredError extends Error {
  constructor(public readonly operation: string) {
    super(`Signer required for ${operation}`);
    this.name = 'SignerRequiredError';
  }
}

export class NotEnlistedError extends Error {
  constructor(
    public readonly identifier: string,
    public readonly role: 'caller' | 'callee'
  ) {
    super(`${role} not enlisted: ${identifier}`);
    this.name = 'NotEnlistedError';
  }
}

export class InteractionNotFoundError extends Error {
  constructor(public readonly interactionId: string) {
    super(`Interaction not found: ${interactionId}`);
    this.name = 'InteractionNotFoundError';
  }
}

export class TransactionError extends Error {
  constructor(
    message: string,
    public readonly transactionHash?: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class QueryError extends Error {
  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'QueryError';
  }
}
