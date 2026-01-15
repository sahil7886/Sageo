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
    enlist(): Promise<void>;
    registerAgent(input: RegisterAgentInput): Promise<AgentProfile>;
    getAgentProfile(sageoId: string): Promise<GetAgentProfileOutput>;
    getAgentCard(sageoId: string): Promise<GetAgentCardOutput>;
    getAgentSkills(sageoId: string): Promise<GetAgentSkillsOutput>;
    getMyProfile(): Promise<AgentProfile | null>;
    getAgentByUrl(url: string): Promise<AgentProfileMeta | null>;
    addSkill(sageoId: string, skill: AgentSkill): Promise<void>;
    private parseProfile;
    private parseProfileMeta;
    private parseCard;
    private parseSkill;
    private parseJsonArray;
}
//# sourceMappingURL=identity.d.ts.map