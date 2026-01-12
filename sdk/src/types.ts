// sdk/src/types.ts
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