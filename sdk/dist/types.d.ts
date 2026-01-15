import type { AgentCard as A2AAgentCard, AgentSkill as A2AAgentSkill, Message, Task, SendMessageRequest } from '@a2a-js/sdk';
export type AgentCard = A2AAgentCard;
export type AgentSkill = A2AAgentSkill;
export interface A2AClient {
    sendMessage(request: SendMessageRequest): Promise<Task | Message>;
    getTask(taskId: string): Promise<Task>;
}
export interface InteractionRecord {
    interaction_id: string;
    caller_sageo_id: string;
    callee_sageo_id: string;
    request_hash: string;
    response_hash: string;
    intent: string;
    status_code: bigint;
    timestamp: bigint;
    a2a_context_id: string;
    a2a_task_id: string;
    a2a_message_id: string;
    end_user_id: string;
    end_user_session_id: string;
}
export interface AgentInteractionStats {
    total_requests_sent: bigint;
    total_requests_received: bigint;
    total_responses_sent: bigint;
    success_count: bigint;
    unique_counterparties: bigint;
    last_interaction_at: bigint;
}
export interface LogRequestInput {
    calleeIdentifier: string;
    requestHash: string;
    intent: string;
    timestamp: bigint;
    a2aContextId: string;
    a2aTaskId: string;
    a2aMessageId: string;
    endUserId: string;
    endUserSessionId: string;
}
export interface LogResponseInput {
    interactionId: string;
    responseHash: string;
    statusCode: bigint;
    timestamp: bigint;
}
export interface ListInteractionsInput {
    agentIdentifier: string;
    limit: bigint;
    offset: bigint;
}
export interface GetInteractionOutput {
    record: InteractionRecord;
    found: boolean;
}
export interface ListInteractionsOutput {
    records: InteractionRecord[];
    total: bigint;
}
export interface GetStatsOutput {
    stats: AgentInteractionStats;
    found: boolean;
}
export interface SDKConfig {
    logicId: string;
    manifest: any;
    rpcUrl?: string;
    privateKey?: string;
}
export declare enum AgentStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    DEPRECATED = "DEPRECATED"
}
export interface AgentProfile {
    sageo_id: string;
    owner: string;
    wallet_address: string;
    status: AgentStatus;
    created_at: bigint;
    updated_at: bigint;
    agent_card: AgentCard;
}
export interface AgentProfileMeta {
    sageo_id: string;
    owner: string;
    wallet_address: string;
    status: AgentStatus;
    created_at: bigint;
    updated_at: bigint;
}
export interface SageoTraceMetadata {
    conversation_id: string;
    interaction_id: string;
    caller_sageo_id: string;
    callee_sageo_id: string;
    end_user?: {
        id: string;
        session_id?: string;
    };
    a2a: {
        contextId?: string;
        taskId?: string;
        messageId?: string;
        method?: string;
    };
    intent: string;
    a2a_client_timestamp_ms?: number;
}
export interface SageoMetadataEnvelope {
    [key: string]: SageoTraceMetadata;
}
export interface RegisterAgentInput {
    agentCard: AgentCard;
    owner?: string;
}
export interface GetAgentProfileOutput {
    profile: AgentProfile | null;
    found: boolean;
}
export interface GetAgentCardOutput {
    card: AgentCard | null;
    found: boolean;
}
export interface GetAgentSkillsOutput {
    skills: AgentSkill[];
    found: boolean;
}
//# sourceMappingURL=types.d.ts.map