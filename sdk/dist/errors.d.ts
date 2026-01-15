export declare class ContractLoadError extends Error {
    readonly logicId: string;
    readonly originalError?: unknown | undefined;
    constructor(logicId: string, originalError?: unknown | undefined);
}
export declare class SignerRequiredError extends Error {
    readonly operation: string;
    constructor(operation: string);
}
export declare class NotEnlistedError extends Error {
    readonly identifier: string;
    readonly role: 'caller' | 'callee';
    constructor(identifier: string, role: 'caller' | 'callee');
}
export declare class InteractionNotFoundError extends Error {
    readonly interactionId: string;
    constructor(interactionId: string);
}
export declare class TransactionError extends Error {
    readonly transactionHash?: string | undefined;
    readonly originalError?: unknown | undefined;
    constructor(message: string, transactionHash?: string | undefined, originalError?: unknown | undefined);
}
export declare class QueryError extends Error {
    readonly originalError?: unknown | undefined;
    constructor(message: string, originalError?: unknown | undefined);
}
//# sourceMappingURL=errors.d.ts.map