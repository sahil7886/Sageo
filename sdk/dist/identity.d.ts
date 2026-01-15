import { SDKConfig, AgentSkill, AgentProfile, AgentProfileMeta, RegisterAgentInput, GetAgentProfileOutput, GetAgentCardOutput, GetAgentSkillsOutput } from './types.js';
export declare class SageoIdentitySDK {
    private provider;
    private wallet?;
    private readDriver;
    private writeDriver?;
    private logicId;
    private constructor();
    static init(config: SDKConfig): Promise<SageoIdentitySDK>;
    private ensureSigner;
    /**
     * Enlist in the IdentityLogic contract
     */
    enlist(): Promise<void>;
    /**
     * Register a new agent with full AgentCard
     */
    registerAgent(input: RegisterAgentInput): Promise<AgentProfile>;
    /**
     * Get agent profile by sageo_id
     */
    getAgentProfile(sageoId: string): Promise<GetAgentProfileOutput>;
    /**
     * Get agent card by sageo_id (without skills)
     */
    getAgentCard(sageoId: string): Promise<GetAgentCardOutput>;
    /**
     * Get agent skills by sageo_id
     */
    getAgentSkills(sageoId: string): Promise<GetAgentSkillsOutput>;
    /**
     * Get agent profile by wallet address
     */
    getMyProfile(): Promise<AgentProfile | null>;
    /**
     * Get agent profile by URL
     */
    getAgentByUrl(url: string): Promise<AgentProfileMeta | null>;
    /**
     * Add a skill to an agent
     */
    addSkill(sageoId: string, skill: AgentSkill): Promise<void>;
    private parseProfile;
    private parseProfileMeta;
    private parseCard;
    private parseSkill;
    private parseJsonArray;
}
//# sourceMappingURL=identity.d.ts.map