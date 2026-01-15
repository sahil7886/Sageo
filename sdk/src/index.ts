// sdk/src/index.ts
export { SageoClient } from './sageo-client.js';
export { SageoA2AClientWrapper } from './a2a-wrapper.js';
export { SageoInteractionSDK } from './interaction.js';
export { SageoIdentitySDK } from './identity.js';

// Types
export type {
  InteractionRecord,
  AgentInteractionStats,
  LogRequestInput,
  LogResponseInput,
  ListInteractionsInput,
  GetInteractionOutput,
  ListInteractionsOutput,
  GetStatsOutput,
  SDKConfig,
  AgentProfile,
  AgentProfileMeta,
  SageoTraceMetadata,
  SageoMetadataEnvelope,
  RegisterAgentInput,
  GetAgentProfileOutput,
  GetAgentCardOutput,
  GetAgentSkillsOutput,
} from './types.js';

// Enums and values (not types)
export { AgentStatus } from './types.js';

// Constants
export { SAGEO_EXTENSION_URI } from './config.js';

// Re-export A2A types for convenience
export type {
  AgentCard,
  AgentSkill,
  Message,
  Task,
  SendMessageRequest,
} from '@a2a-js/sdk';

export type { A2AClient } from './types.js';
