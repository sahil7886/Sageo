import type { AgentCard } from '@a2a-js/sdk';
import type { A2AClient } from './types.js';
import { SageoIdentitySDK } from './identity.js';
import { SageoInteractionSDK } from './interaction.js';
import { SageoA2AClientWrapper } from './a2a-wrapper.js';
import type { AgentProfile, AgentSkill } from './types.js';
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
    /**
     * Initialize the client and ensure agent is registered
     */
    initialize(): Promise<void>;
    /**
     * Get the current agent's Sageo profile
     */
    getMyProfile(): Promise<AgentProfile>;
    /**
     * Wrap an A2A client to automatically log interactions
     */
    wrapA2AClient(a2aClient: A2AClient, remoteAgentCard: AgentCard): SageoA2AClientWrapper;
    /**
     * Get agent card by sageo_id (with skills merged)
     */
    getAgentCard(sageoId: string): Promise<AgentCard>;
    /**
     * Get agent skills by sageo_id
     */
    getAgentSkills(sageoId: string): Promise<AgentSkill[]>;
    /**
     * Get agent profile by sageo_id
     */
    getAgentProfile(sageoId: string): Promise<AgentProfile>;
    /**
     * Resolve sageo_id to wallet address (for InteractionLogic)
     */
    resolveSageoIdToAddress(sageoId: string): Promise<string>;
    get identity(): SageoIdentitySDK;
    get interaction(): SageoInteractionSDK;
    get mySageoIdValue(): string | undefined;
}
//# sourceMappingURL=sageo-client.d.ts.map