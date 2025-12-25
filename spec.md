# Sageo SDK Specification

This document defines the types, interfaces, and API for the Sageo SDK - a trust and discovery layer for AI agents built on MOI blockchain.

---

## A2A Types (from `@a2a-js/sdk`)

Types imported directly from the official A2A SDK: (found here: https://github.com/a2aproject/a2a-js/blob/main/src/types.ts)

```typescript
import type {
    // Core agent metadata types
    AgentCard,
    AgentSkill,
    AgentCapabilities1,
    AgentProvider,
    AgentInterface,
    AgentExtension,
    AgentCardSignature,
    SecurityScheme,

    // Message and content types
    Message1 as Message,
    Part,
    TextPart,
    FilePart,
    DataPart,

    // Task types
    Task1 as Task,
    TaskStatus,
    TaskState,
    Artifact,
    TaskStatusUpdateEvent,
    TaskArtifactUpdateEvent,

    // Request/Response types
    SendMessageRequest,
    SendMessageResponse,
    SendMessageSuccessResponse,
    MessageSendParams,
    MessageSendConfiguration,

    // Push notification types
    PushNotificationConfig1,
    TaskPushNotificationConfig1,

    // Task query/control types
    TaskQueryParams,
    TaskIdParams,
    GetTaskPushNotificationConfigParams,
    ListTaskPushNotificationConfigParams,
    DeleteTaskPushNotificationConfigParams,
} from '@a2a-js/sdk';

// Server-side types from @a2a-js/sdk/server
import type {
    A2ARequestHandler,
    AgentExecutor,
    RequestContext,
    ExecutionEventBus,
    TaskStore,
    ServerCallContext,
} from '@a2a-js/sdk/server';

import { DefaultRequestHandler, InMemoryTaskStore } from '@a2a-js/sdk/server';
```

### Key A2A Type Definitions (Reference)
These are definitions of just some of the core types we import from @a2a-js/sdk. Listed here for reference.

```typescript
interface AgentCard {
    name: string;
    description: string;
    version: string;
    url: string;
    protocolVersion: string;
    defaultInputModes: string[];
    defaultOutputModes: string[];
    capabilities: AgentCapabilities1;
    skills: AgentSkill[];
    provider?: AgentProvider;
    iconUrl?: string;
    documentationUrl?: string;
    preferredTransport?: "JSONRPC" | "GRPC" | "HTTP+JSON";
    additionalInterfaces?: AgentInterface[];
    securitySchemes?: Record<string, SecurityScheme>;
    security?: Record<string, string[]>[];
    supportsAuthenticatedExtendedCard?: boolean;
    signatures?: AgentCardSignature[];
}

interface AgentSkill {
    id: string;
    name: string;
    description: string;
    tags: string;
    examples?: string[];
    inputModes?: string[];
    outputModes?: string[];
    security?: Record<string, string[]>[];
}

interface AgentCapabilities1 {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
    extensions?: AgentExtension[];
}

interface Task {
    kind: "task";
    id: string;
    contextId: string;
    status: TaskStatus;
    history?: Message[];
    artifacts?: Artifact[];
    metadata?: Record<string, unknown>;
}

interface Message {
    kind: "message";
    messageId: string;
    role: "user" | "agent";
    parts: Part[];
    contextId?: string;
    taskId?: string;
    referenceTaskIds?: string[];
    metadata?: Record<string, unknown>;
}

interface SendMessageRequest {
    id: string | number;
    jsonrpc: "2.0";
    method: "message/send";
    params: MessageSendParams;
}
```

The rest can be found at https://github.com/a2aproject/a2a-js/blob/main/src/types.ts or https://a2a-protocol.org/v0.3.0/specification/.
---

## Sageo-Specific Types

These types are defined by Sageo and are NOT part of the A2A spec.

### SageoTraceMetadata (data injected into A2A)
```typescript
export interface SageoTraceMetadata {
  conversation_id: string;   // stable across a thread (maps to A2A contextId)
  interaction_id: string;    // stable per request/response pair (can map to A2A messageId)

  caller_sageo_id: string;
  callee_sageo_id: string;

  a2a: {
    contextId?: string; // A2A Message.contextId 
    taskId?: string;    // A2A Message.taskId 
    messageId?: string; // A2A Message.messageId 
    method?: "message/send" | "message/stream";
  };

  intent: string;
  a2a_client_timestamp_ms?: number; // optional client-side timing (unix ms)
}

export type SageoMetadataEnvelope = {
  [SAGEO_EXTENSION_URI]: SageoTraceMetadata;
};
```

Sageo injects SageoMetadataEnvelope into Message.metadata (and adds SAGEO_EXTENSION_URI into Message.extensions), using A2A's extension hooks. ["https://a2a-protocol.org/latest/topics/extensions/"]

### AgentStatus

```typescript
enum AgentStatus {
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    DEPRECATED = "DEPRECATED"
}
```

Sageo-specific status states for registered agents.

### AgentProfile

```typescript
interface AgentProfile {
    sageo_id: string;           // Sageo-assigned unique identifier (on-chain)
    owner: string;              // MOI participant ID of the agent owner
    status: AgentStatus;        // Sageo operational status
    created_at: timestamp;         // Unix timestamp of registration
    updated_at: timestamp;         // Unix timestamp of last update
    agent_card: AgentCard;      // The agent's A2A AgentCard with all metadata
}
```

Sageo on-chain agent profile - extends A2A AgentCard with blockchain identity. Stores the full AgentCard data plus Sageo-specific fields for trust/discovery.

### InteractionRecord (data logged on Moi)

```typescript
interface InteractionRecord {
    interaction_id: string;
    caller_sageo_id: string;
    callee_sageo_id: string;
    request_hash: string;
    response_hash: string | null;
    intent: string;
    status_code: number | null;
    timestamp: number;
    a2a_context_id: string;
    a2a_task_id: string;
    a2a_message_id: string;
}
```

On-chain proof of an agent-to-agent interaction.

---

## SageoIdentityLogic

MOI Logic for agent identity management. Handles registration, profile updates, and status changes. Deployed as a Coco logic on MOI blockchain.

### `register_agent`

```typescript
register_agent(agent_card: AgentCard, owner?: string): AgentProfile
```

Registers a new agent on Sageo using its A2A AgentCard.

**Input:**
- `agent_card` - The agent's A2A AgentCard with all metadata
- `owner` - MOI participant ID; defaults to transaction sender

**Output:**
- The newly created agent profile with assigned `sageo_id`

---

### `get_agent_by_id`

```typescript
get_agent_by_id(sageo_id: string): AgentProfile | null
```

Retrieves an agent profile by its Sageo ID.

**Input:**
- `sageo_id` - Sageo-assigned unique identifier

**Output:**
- The agent profile if found, `null` otherwise

---

### `get_agent_by_url`

```typescript
get_agent_by_url(url: string): AgentProfile | null
```

Retrieves an agent profile by its A2A endpoint URL.

**Input:**
- `url` - Agent's A2A endpoint URL

**Output:**
- The agent profile if found, `null` otherwise

---

### `update_agent_card`

```typescript
update_agent_card(sageo_id: string, agent_card: AgentCard): AgentProfile
```

Updates an agent's full AgentCard metadata (owner-only operation). Called by the frontend agent manager. Ownership is verified by checking that the transaction sender matches the agent's owner.

**Input:**
- `sageo_id` - Sageo ID of the agent to update
- `agent_card` - Updated A2A AgentCard

**Output:**
- The updated agent profile

---

### `set_agent_status`

```typescript
set_agent_status(
    sageo_id: string,
    status: AgentStatus
): AgentProfile
```

Updates an agent's operational status (owner-only). Called by the frontend agent manager. Ownership is verified by checking that the transaction sender matches the agent's owner.

**Input:**
- `sageo_id` - Sageo ID of the agent
- `status` - New status (ACTIVE, PAUSED, or COMPROMISED)

**Output:**
- The updated agent profile

---

### `list_agents`

```typescript
list_agents(
    tags?: string[],
    status?: AgentStatus,
    capabilities?: Record<string, boolean>,
    limit?: number,  // default: 50, max: 100
    offset?: number  // default: 0
): AgentProfile[]
```

Lists registered agents with optional filtering.

**Input:**
- `tags` - Filter by agents having skills with ALL these tags
- `status` - Filter by Sageo status (default: all statuses)
- `capabilities` - Filter by capabilities (e.g., `{"streaming": true}`)
- `limit` - Maximum number of results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Output:**
- List of matching agent profiles

---

### `search_agents`

```typescript
search_agents(query: string, limit?: number): AgentProfile[]
```

Searches agents by name, description, or skill tags using substring matching (case-insensitive). For fuzzy matching and advanced ranking, use the client-side `SageoExplorer.search_agents` method.

**Input:**
- `query` - Search query string
- `limit` - Maximum results to return (default: 20)

**Output:**
- List of matching agents (simple substring match, not ranked)

---

### `get_agents_by_skill`

```typescript
get_agents_by_skill(skill_id: string, limit?: number): AgentProfile[]
```

Finds agents that have a specific skill.

**Input:**
- `skill_id` - The skill ID to search for
- `limit` - Maximum results (default: 50)

**Output:**
- List of agents with the specified skill

---

## SageoInteractionLogic

MOI Logic for interaction proof logging. Records hashed request/response data to create verifiable interaction history. Deployed as Coco logic on MOI blockchain.

### `log_request`

```typescript
log_request(
    caller_agent_id: string,
    callee_agent_id: string,
    request_hash: string,
    intent: string
): string
```

Logs the initiation of an agent-to-agent request and returns an interaction ID.

**Input:**
- `caller_agent_id` - Sageo ID of the agent making the request
- `callee_agent_id` - Sageo ID of the agent receiving the request
- `request_hash` - SHA-256 hash of the request payload
- `intent` - Short label describing the request purpose (e.g., "currency_conversion")

**Output:**
- Unique `interaction_id` for linking the subsequent response

---

### `log_response`

```typescript
log_response(
    interaction_id: string,
    response_hash: string,
    status_code: number
): InteractionRecord
```

Logs the response to a previously logged request, completing the interaction proof.

**Input:**
- `interaction_id` - ID returned from `log_request`
- `response_hash` - SHA-256 hash of the response payload
- `status_code` - HTTP-like status code (200=success, 400=client error, 500=server error)

**Output:**
- The completed interaction record

---

### `get_interaction`

```typescript
get_interaction(interaction_id: string): InteractionRecord | null
```

Retrieves a specific interaction record by ID.

**Input:**
- `interaction_id` - Unique interaction identifier

**Output:**
- The interaction record if found, `null` otherwise

---

### `list_interactions_by_agent`

```typescript
list_interactions_by_agent(
    agent_id: string,
    limit?: number,  // default: 50, max: 100
    offset?: number  // default: 0
): InteractionRecord[]
```

Lists interactions involving a specific agent.

**Input:**
- `agent_id` - Sageo ID of the agent
- `limit` - Maximum results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Output:**
- List of interactions, newest first

---

### `list_interactions_between_agents`

```typescript
list_interactions_between_agents(
    agent_a_id: string,
    agent_b_id: string,
    limit?: number,  // default: 50
    offset?: number  // default: 0
): InteractionRecord[]
```

Lists all interactions between two specific agents (in either direction).

**Input:**
- `agent_a_id` - Sageo ID of first agent
- `agent_b_id` - Sageo ID of second agent
- `limit` - Maximum results (default: 50)
- `offset` - Pagination offset (default: 0)

**Output:**
- List of interactions between the two agents

---

### `get_agent_interaction_stats`

```typescript
interface AgentInteractionStats {
    total_requests_sent: number;
    total_requests_received: number;
    total_responses_sent: number;
    success_rate: number;
    unique_counterparties: number;
    last_interaction_at: number;
}

get_agent_interaction_stats(agent_id: string): AgentInteractionStats
```

Returns aggregate statistics about an agent's interactions.

**Input:**
- `agent_id` - Sageo ID of the agent

**Output:**
- Statistics object with interaction metrics

---

## SageoClient

Main SDK client that wraps A2A communication with automatic Sageo logging. This is the primary interface developers use to integrate Sageo.

### Constructor

```typescript
new SageoClient(moi_rpc_url: string, agent_key: string, agent_card: AgentCard)
```

Initializes the Sageo client and ensures agent is registered.

**Input:**
- `moi_rpc_url` - URL of the MOI RPC endpoint
- `agent_key` - Private key for signing interactions
- `agent_card` - This agent's A2A AgentCard

---

### `get_my_profile`

```typescript
get_my_profile(): AgentProfile
```

Returns the current agent's Sageo profile.

**Output:**
- This agent's on-chain profile

---

### `wrap_a2a_client`

```typescript
wrap_a2a_client(a2a_client: A2AClient): SageoA2AClientWrapper
```

Wraps an existing A2A client to automatically log interactions.

**Input:**
- `a2a_client` - An instance of A2AClient from `@a2a-js/sdk`

**Output:**
- Drop-in replacement that logs to Sageo

---

### `wrap_request_handler`

```typescript
wrap_request_handler(handler: DefaultRequestHandler): SageoRequestHandler
```

Wraps an existing A2A `DefaultRequestHandler` to automatically log responses when this agent receives requests.

**Input:**
- `handler` - An instance of `DefaultRequestHandler` from `@a2a-js/sdk/server`

**Output:**
- `SageoRequestHandler` that logs responses to MOI

---

### `log_interaction_manually`

```typescript
log_interaction_manually(
    callee_sageo_id: string,
    intent: string,
    request_payload: Uint8Array,
    response_payload: Uint8Array,
    status_code: number
): InteractionRecord
```

Manually logs a complete interaction (fallback mechanism for cases where wrapping doesn't work).

**Input:**
- `callee_sageo_id` - Sageo ID of the agent that was called
- `intent` - Short description of the interaction purpose
- `request_payload` - Raw request data (will be hashed)
- `response_payload` - Raw response data (will be hashed)
- `status_code` - Result status code

**Output:**
- The logged interaction proof

---

## SageoA2AClientWrapper

A drop-in replacement for A2AClient that automatically logs interactions to Sageo. All A2AClient methods are proxied with Sageo logging added.

### Constructor

```typescript
new SageoA2AClientWrapper(a2a_client: A2AClient, remote_agent_card: AgentCard)
```

Creates a wrapped A2A client.

**Input:**
- `a2a_client` - The underlying A2AClient to wrap
- `remote_agent_card` - Card of the remote agent being called

---

### `send_message`

```typescript
async send_message(request: SendMessageRequest): Promise<Task | Message>
```

Sends a message to the remote agent with automatic Sageo logging. Calls log_request() coco endpoint.

**Input:**
- `request` - Standard A2A message request

**Output:**
- Standard A2A response (Task or Message)

---

### `send_message_streaming`

```typescript
async send_message_streaming(request: SendMessageRequest): AsyncIterable<StreamingEvent>
```

Sends a streaming message request with Sageo logging.

**Input:**
- `request` - Standard A2A streaming request

**Output:**
- Stream of A2A events

---

### `get_task`

```typescript
async get_task(task_id: string): Promise<Task>
```

Retrieves a task by ID (passthrough, no logging needed).

**Input:**
- `task_id` - A2A task identifier

**Output:**
- The task object

---

## SageoRequestHandler

A wrapper around the A2A SDK's `DefaultRequestHandler` that logs interactions when your agent receives requests from other agents. This is the server-side complement to `SageoA2AClientWrapper`.


```typescript
new SageoRequestHandler(
    underlying: DefaultRequestHandler,
    sageo_client: SageoClient
)
```

Creates a Sageo-aware request handler that wraps an existing `DefaultRequestHandler`.

**Input:**
- `underlying` - The `DefaultRequestHandler` instance that processes requests
- `sageo_client` - The `SageoClient` for logging interactions to MOI

---

### `sendMessage`

```typescript
sendMessage(
    params: MessageSendParams,
    context?: ServerCallContext
): Message | Task
```

Handles an incoming message request with automatic Sageo response logging. Extracts `SageoTraceMetadata` from the message, delegates to the underlying handler, and logs the response hash to MOI if trace metadata is present.

**Input:**
- `params` - Standard A2A `MessageSendParams`
- `context` - Optional server call context

**Output:**
- Standard A2A response (Task or Message)

---

### `sendMessageStream`

```typescript
sendMessageStream(
    params: MessageSendParams,
    context?: ServerCallContext
): Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent
```

Handles a streaming message request with Sageo response logging after stream completion. Yields events from the underlying handler and logs the final task state hash to MOI if trace metadata is present.

**Input:**
- `params` - Standard A2A `MessageSendParams`
- `context` - Optional server call context

**Output:**
- Stream of A2A events

---

### `getAgentCard`

```typescript
getAgentCard(): AgentCard
```

Passthrough to underlying handler. Returns the agent's card.

---

### `getTask`

```typescript
async getTask(params: TaskQueryParams, context?: ServerCallContext): Task
```

Passthrough to underlying handler. Retrieves task by ID (no logging needed).

---

### `cancelTask`

```typescript
async cancelTask(params: TaskIdParams, context?: ServerCallContext): Task
```

Passthrough to underlying handler. Cancels a task (no logging needed).

---

### `setTaskPushNotificationConfig`

```typescript
setTaskPushNotificationConfig(
    params: TaskPushNotificationConfig,
    context?: ServerCallContext
): TaskPushNotificationConfig
```

Passthrough to underlying handler.

---

### `getTaskPushNotificationConfig`

```typescript
getTaskPushNotificationConfig(
    params: TaskIdParams | GetTaskPushNotificationConfigParams,
    context?: ServerCallContext
): TaskPushNotificationConfig
```

Passthrough to underlying handler.

---

### `listTaskPushNotificationConfigs`

```typescript
async listTaskPushNotificationConfigs(
    params: ListTaskPushNotificationConfigParams,
    context?: ServerCallContext
): Promise<TaskPushNotificationConfig[]>
```

Passthrough to underlying handler.

---

### `deleteTaskPushNotificationConfig`

```typescript
async deleteTaskPushNotificationConfig(
    params: DeleteTaskPushNotificationConfigParams,
    context?: ServerCallContext
): Promise<void>
```

Passthrough to underlying handler.

---

### `resubscribe`

```typescript
async *resubscribe(
    params: TaskIdParams,
    context?: ServerCallContext
): AsyncGenerator<Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent>
```

Passthrough to underlying handler. Resubscribes to task updates (no additional logging needed as the original interaction was already logged).

---

### Sageo Server Side Usage Example

```typescript
import { DefaultRequestHandler, InMemoryTaskStore } from '@a2a-js/sdk/server';
import { SageoClient, SageoRequestHandler } from 'sageo-sdk';

const agentExecutor: AgentExecutor = new MyAgentExecutor();

const underlyingHandler = new DefaultRequestHandler(
    myAgentCard,
    new InMemoryTaskStore(),
    agentExecutor
);

const sageoClient = new SageoClient(
    'https://moi-rpc.example.com',
    process.env.MOI_AGENT_KEY,
    myAgentCard
);

const sageoHandler = new SageoRequestHandler(underlyingHandler, sageoClient);

// Use sageoHandler in your agent server setup
```

---

## SageoExplorer

REST API server that the frontend connects to for querying the Sageo network. Provides read-only endpoints for agent discovery and interaction viewing. Connects to MOI blockchain via RPC.

---

### `GET /agents`

Lists registered agents with optional filtering.

**Query Parameters:**
- `tags` - Comma-separated skill tags to filter by
- `status` - Filter by status (ACTIVE, PAUSED, DEPRECATED)
- `streaming` - Filter by streaming capability (true/false)
- `limit` - Max results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:** `AgentProfile[]`

---

### `GET /agents/search`

Searches for agents by name, description, or tags using fuzzy matching and ranking.

**Query Parameters:**
- `q` - Search query (required)
- `limit` - Max results (default: 20)

**Response:** `AgentProfile[]` (ranked by relevance)

---

### `GET /agents/by-skill/:skill_id`

Finds agents that have a specific skill.

**Path Parameters:**
- `skill_id` - The skill ID to search for

**Query Parameters:**
- `limit` - Max results (default: 50)

**Response:** `AgentProfile[]`

---

### `GET /agents/by-url`

Retrieves an agent profile by its A2A endpoint URL.

**Query Parameters:**
- `url` - A2A endpoint URL (required)

**Response:** `AgentProfile | null`

---

### `GET /agents/:sageo_id`

Retrieves an agent profile by Sageo ID.

**Path Parameters:**
- `sageo_id` - Sageo agent ID

**Response:** `AgentProfile | null`

---

### `GET /agents/:sageo_id/card`

Retrieves just the A2A AgentCard for an agent.

**Path Parameters:**
- `sageo_id` - Sageo agent ID

**Response:** `AgentCard | null`

---

### `GET /agents/:sageo_id/interactions`

Gets interactions for a specific agent.

**Path Parameters:**
- `sageo_id` - Sageo agent ID

**Query Parameters:**
- `limit` - Max results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

**Response:** `InteractionRecord[]`

---

### `GET /agents/:sageo_id/stats`

Gets aggregate statistics for an agent.

**Path Parameters:**
- `sageo_id` - Sageo agent ID

**Response:** `AgentInteractionStats`

---

### `GET /interactions/:interaction_id`

Retrieves a specific interaction by ID.

**Path Parameters:**
- `interaction_id` - Interaction identifier

**Response:** `InteractionRecord | null`

---

### `GET /interactions/:interaction_id/verify`

Verifies that provided payloads match the on-chain hashes.

**Path Parameters:**
- `interaction_id` - Interaction to verify

**Query Parameters:**
- `request_hash` - Hash of request payload to check (required)
- `response_hash` - Hash of response payload to check (optional)

**Response:** `{ valid: boolean }`
