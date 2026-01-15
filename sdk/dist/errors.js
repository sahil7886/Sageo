// sdk/src/errors.ts
export class ContractLoadError extends Error {
    logicId;
    originalError;
    constructor(logicId, originalError) {
        super(`Failed to load contract ${logicId}: ${originalError instanceof Error ? originalError.message : 'Unknown error'}`);
        this.logicId = logicId;
        this.originalError = originalError;
        this.name = 'ContractLoadError';
    }
}
export class SignerRequiredError extends Error {
    operation;
    constructor(operation) {
        super(`Signer required for ${operation}`);
        this.operation = operation;
        this.name = 'SignerRequiredError';
    }
}
export class NotEnlistedError extends Error {
    identifier;
    role;
    constructor(identifier, role) {
        super(`${role} not enlisted: ${identifier}`);
        this.identifier = identifier;
        this.role = role;
        this.name = 'NotEnlistedError';
    }
}
export class InteractionNotFoundError extends Error {
    interactionId;
    constructor(interactionId) {
        super(`Interaction not found: ${interactionId}`);
        this.interactionId = interactionId;
        this.name = 'InteractionNotFoundError';
    }
}
export class TransactionError extends Error {
    transactionHash;
    originalError;
    constructor(message, transactionHash, originalError) {
        super(message);
        this.transactionHash = transactionHash;
        this.originalError = originalError;
        this.name = 'TransactionError';
    }
}
export class QueryError extends Error {
    originalError;
    constructor(message, originalError) {
        super(message);
        this.originalError = originalError;
        this.name = 'QueryError';
    }
}
//# sourceMappingURL=errors.js.map