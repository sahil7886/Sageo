import { SDKConfig, LogRequestInput, LogResponseInput, InteractionLogRequestResult, InteractionLogResponseResult, ListInteractionsInput, GetInteractionOutput, ListInteractionsOutput, GetStatsOutput } from './types.js';
export declare class SageoInteractionSDK {
    private provider;
    private wallet?;
    private readDriver;
    private writeDriver?;
    private logicId;
    private writeQueue;
    private constructor();
    static init(config: SDKConfig): Promise<SageoInteractionSDK>;
    private ensureSigner;
    private enqueueWrite;
    enlist(sageoId: string): Promise<void>;
    logRequest(input: LogRequestInput): Promise<string>;
    logRequestWithTx(input: LogRequestInput): Promise<InteractionLogRequestResult>;
    logResponse(input: LogResponseInput): Promise<void>;
    logResponseWithTx(input: LogResponseInput): Promise<InteractionLogResponseResult>;
    getInteraction(agentIdentifier: string, interactionId: string): Promise<GetInteractionOutput>;
    listInteractionsByAgent(input: ListInteractionsInput): Promise<ListInteractionsOutput>;
    getAgentStats(agentIdentifier: string): Promise<GetStatsOutput>;
    getWalletIdentifier(): Promise<string>;
    private parseRecord;
    private parseStats;
}
//# sourceMappingURL=interaction.d.ts.map