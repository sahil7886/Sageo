import type { AgentCard } from '@a2a-js/sdk';
import type { A2AClient } from './types.js';
import { SageoIdentitySDK } from './identity.js';
import { SageoInteractionSDK } from './interaction.js';
import { SageoA2AClientWrapper } from './a2a-wrapper.js';
import { SageoRequestHandler } from './request-handler.js';
import type { AgentProfile, AgentSkill } from './types.js';
import type { A2ARequestHandler } from '@a2a-js/sdk/server';
export declare class SageoClient {
    private moiRpcUrl;
    private agentKey;
    private agentCard;
    private identityLogicId;
    private interactionLogicId;
    private identitySDK;
    private interactionSDK;
    private initialized;
    private mySageoId?;
    constructor(moiRpcUrl: string, agentKey: string, agentCard: AgentCard, identityLogicId?: string, interactionLogicId?: string);
    initialize(): Promise<void>;
    getMyProfile(): Promise<AgentProfile>;
    wrapA2AClient(a2aClient: A2AClient, remoteAgentCard: AgentCard): SageoA2AClientWrapper;
    wrapRequestHandler(handler: A2ARequestHandler): SageoRequestHandler;
    getAgentCard(sageoId: string): Promise<AgentCard>;
    getAgentSkills(sageoId: string): Promise<AgentSkill[]>;
    getAgentProfile(sageoId: string): Promise<AgentProfile>;
    resolveSageoIdToAddress(sageoId: string): Promise<string>;
    get identity(): SageoIdentitySDK;
    get interaction(): SageoInteractionSDK;
    get mySageoIdValue(): string | undefined;
}
//# sourceMappingURL=sageo-client.d.ts.map