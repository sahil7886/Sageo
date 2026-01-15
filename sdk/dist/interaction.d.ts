import { SDKConfig, LogRequestInput, LogResponseInput, ListInteractionsInput, GetInteractionOutput, ListInteractionsOutput, GetStatsOutput } from './types.js';
export declare class SageoInteractionSDK {
    private provider;
    private wallet?;
    private readDriver;
    private writeDriver?;
    private logicId;
    private constructor();
    static init(config: SDKConfig): Promise<SageoInteractionSDK>;
    private ensureSigner;
    enlist(sageoId: string): Promise<void>;
    logRequest(input: LogRequestInput): Promise<string>;
    logResponse(input: LogResponseInput): Promise<void>;
    getInteraction(agentIdentifier: string, interactionId: string): Promise<GetInteractionOutput>;
    listInteractionsByAgent(input: ListInteractionsInput): Promise<ListInteractionsOutput>;
    getAgentStats(agentIdentifier: string): Promise<GetStatsOutput>;
    getWalletIdentifier(): Promise<string>;
    private parseRecord;
    private parseStats;
}
//# sourceMappingURL=interaction.d.ts.map