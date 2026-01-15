// sdk/src/sageo-client.ts
import type { AgentCard } from '@a2a-js/sdk';
import type { A2AClient } from './types.js';
import { SageoIdentitySDK } from './identity.js';
import { SageoInteractionSDK } from './interaction.js';
import { SageoA2AClientWrapper } from './a2a-wrapper.js';
import {
  loadManifest,
  DEFAULT_IDENTITY_LOGIC_ID,
  DEFAULT_INTERACTION_LOGIC_ID,
} from './config.js';
import type { AgentProfile, AgentSkill } from './types.js';
import { getIdentifier } from './utils.js';

export class SageoClient {
  private moiRpcUrl: string;
  private agentKey: string;
  private agentCard: AgentCard;
  private identityLogicId: string;
  private interactionLogicId: string;
  private identitySDK!: SageoIdentitySDK;
  private interactionSDK!: SageoInteractionSDK;
  private initialized: boolean = false;
  private mySageoId?: string;

  constructor(
    moiRpcUrl: string,
    agentKey: string,
    agentCard: AgentCard,
    identityLogicId?: string,
    interactionLogicId?: string
  ) {
    this.moiRpcUrl = moiRpcUrl;
    this.agentKey = agentKey;
    this.agentCard = agentCard;
    this.identityLogicId = identityLogicId || DEFAULT_IDENTITY_LOGIC_ID;
    this.interactionLogicId =
      interactionLogicId || DEFAULT_INTERACTION_LOGIC_ID;
  }


  async initialize(): Promise<void> {
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

    try {
      await this.identitySDK.enlist();
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('account not found')) {

      } else if (!errorMsg.includes('already enlisted')) {
        console.warn('Failed to enlist in IdentityLogic:', errorMsg);
      }
    }

    const myProfile = await this.identitySDK.getMyProfile();
    if (myProfile) {
      this.mySageoId = myProfile.sageo_id;
    } else {
      const profile = await this.identitySDK.registerAgent({
        agentCard: this.agentCard,
      });
      this.mySageoId = profile.sageo_id;
    }

    // Enlist in InteractionLogic
    if (this.mySageoId) {
      try {
        await this.interactionSDK.enlist(this.mySageoId);
      } catch (error) {

        // Ignore if already enlisted
        const errorMsg = String(error);
        if (!errorMsg.includes('already enlisted')) {
          console.warn('Failed to enlist in InteractionLogic:', errorMsg);
        }
      }
    }

    this.initialized = true;
  }


  async getMyProfile(): Promise<AgentProfile> {
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


  wrapA2AClient(
    a2aClient: A2AClient,
    remoteAgentCard: AgentCard
  ): SageoA2AClientWrapper {
    if (!this.initialized) {
      throw new Error(
        'SageoClient not initialized. Call initialize() first or use await getMyProfile()'
      );
    }

    return new SageoA2AClientWrapper(
      a2aClient,
      this,
      remoteAgentCard,
      this.mySageoId!
    );
  }


  async getAgentCard(sageoId: string): Promise<AgentCard> {
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


  async getAgentSkills(sageoId: string): Promise<AgentSkill[]> {
    await this.initialize();

    const result = await this.identitySDK.getAgentSkills(sageoId);
    return result.skills;
  }


  async getAgentProfile(sageoId: string): Promise<AgentProfile> {
    await this.initialize();

    const result = await this.identitySDK.getAgentProfile(sageoId);
    if (!result.found || !result.profile) {
      throw new Error(`Agent profile not found: ${sageoId}`);
    }

    return result.profile;
  }


  async resolveSageoIdToAddress(sageoId: string): Promise<string> {
    await this.initialize();

    const profile = await this.getAgentProfile(sageoId);
    return profile.wallet_address;
  }

  // Expose SDKs for internal use
  get identity(): SageoIdentitySDK {
    if (!this.initialized) {
      throw new Error('SageoClient not initialized');
    }
    return this.identitySDK;
  }

  get interaction(): SageoInteractionSDK {
    if (!this.initialized) {
      throw new Error('SageoClient not initialized');
    }
    return this.interactionSDK;
  }

  get mySageoIdValue(): string | undefined {
    return this.mySageoId;
  }
}
