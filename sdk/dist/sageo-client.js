import { SageoIdentitySDK } from './identity.js';
import { SageoInteractionSDK } from './interaction.js';
import { SageoA2AClientWrapper } from './a2a-wrapper.js';
import { loadManifest, DEFAULT_IDENTITY_LOGIC_ID, DEFAULT_INTERACTION_LOGIC_ID, } from './config.js';
export class SageoClient {
    moiRpcUrl;
    agentKey;
    agentCard;
    identityLogicId;
    interactionLogicId;
    identitySDK;
    interactionSDK;
    initialized = false;
    mySageoId;
    constructor(moiRpcUrl, agentKey, agentCard, identityLogicId, interactionLogicId) {
        this.moiRpcUrl = moiRpcUrl;
        this.agentKey = agentKey;
        this.agentCard = agentCard;
        this.identityLogicId = identityLogicId || DEFAULT_IDENTITY_LOGIC_ID;
        this.interactionLogicId =
            interactionLogicId || DEFAULT_INTERACTION_LOGIC_ID;
    }
    /**
     * Initialize the client and ensure agent is registered
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        // Load manifests
        const identityManifest = loadManifest('identity');
        const interactionManifest = loadManifest('interaction');
        // Initialize Identity SDK
        this.identitySDK = await SageoIdentitySDK.init({
            logicId: this.identityLogicId,
            manifest: identityManifest,
            rpcUrl: this.moiRpcUrl,
            privateKey: this.agentKey,
        });
        // Initialize Interaction SDK
        this.interactionSDK = await SageoInteractionSDK.init({
            logicId: this.interactionLogicId,
            manifest: interactionManifest,
            rpcUrl: this.moiRpcUrl,
            privateKey: this.agentKey,
        });
        // Enlist in IdentityLogic if needed
        try {
            await this.identitySDK.enlist();
        }
        catch (error) {
            // Ignore if already enlisted
            const errorMsg = String(error);
            if (!errorMsg.includes('already enlisted')) {
                console.warn('Failed to enlist in IdentityLogic:', errorMsg);
            }
        }
        // Check if agent is already registered
        const myProfile = await this.identitySDK.getMyProfile();
        if (myProfile) {
            this.mySageoId = myProfile.sageo_id;
        }
        else {
            // Register the agent
            const profile = await this.identitySDK.registerAgent({
                agentCard: this.agentCard,
            });
            this.mySageoId = profile.sageo_id;
        }
        // Enlist in InteractionLogic
        if (this.mySageoId) {
            try {
                await this.interactionSDK.enlist(this.mySageoId);
            }
            catch (error) {
                // Ignore if already enlisted
                const errorMsg = String(error);
                if (!errorMsg.includes('already enlisted')) {
                    console.warn('Failed to enlist in InteractionLogic:', errorMsg);
                }
            }
        }
        this.initialized = true;
    }
    /**
     * Get the current agent's Sageo profile
     */
    async getMyProfile() {
        await this.initialize();
        if (!this.mySageoId) {
            throw new Error('Agent not registered');
        }
        const result = await this.identitySDK.getAgentProfile(this.mySageoId);
        if (!result.found || !result.profile) {
            throw new Error('Failed to fetch agent profile');
        }
        return result.profile;
    }
    /**
     * Wrap an A2A client to automatically log interactions
     */
    wrapA2AClient(a2aClient, remoteAgentCard) {
        if (!this.initialized) {
            throw new Error('SageoClient not initialized. Call initialize() first or use await getMyProfile()');
        }
        return new SageoA2AClientWrapper(a2aClient, this, remoteAgentCard, this.mySageoId);
    }
    /**
     * Get agent card by sageo_id (with skills merged)
     */
    async getAgentCard(sageoId) {
        await this.initialize();
        const cardResult = await this.identitySDK.getAgentCard(sageoId);
        if (!cardResult.found || !cardResult.card) {
            throw new Error(`Agent card not found: ${sageoId}`);
        }
        const skillsResult = await this.identitySDK.getAgentSkills(sageoId);
        if (skillsResult.found) {
            cardResult.card.skills = skillsResult.skills;
        }
        return cardResult.card;
    }
    /**
     * Get agent skills by sageo_id
     */
    async getAgentSkills(sageoId) {
        await this.initialize();
        const result = await this.identitySDK.getAgentSkills(sageoId);
        return result.skills;
    }
    /**
     * Get agent profile by sageo_id
     */
    async getAgentProfile(sageoId) {
        await this.initialize();
        const result = await this.identitySDK.getAgentProfile(sageoId);
        if (!result.found || !result.profile) {
            throw new Error(`Agent profile not found: ${sageoId}`);
        }
        return result.profile;
    }
    /**
     * Resolve sageo_id to wallet address (for InteractionLogic)
     */
    async resolveSageoIdToAddress(sageoId) {
        await this.initialize();
        const profile = await this.getAgentProfile(sageoId);
        return profile.wallet_address;
    }
    // Expose SDKs for internal use
    get identity() {
        if (!this.initialized) {
            throw new Error('SageoClient not initialized');
        }
        return this.identitySDK;
    }
    get interaction() {
        if (!this.initialized) {
            throw new Error('SageoClient not initialized');
        }
        return this.interactionSDK;
    }
    get mySageoIdValue() {
        return this.mySageoId;
    }
}
//# sourceMappingURL=sageo-client.js.map